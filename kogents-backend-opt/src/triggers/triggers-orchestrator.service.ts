import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, JobsOptions, Processor, Job } from 'bullmq';
import { Redis } from 'ioredis';
import * as os from 'os';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActionType, DepartmentStatus, LogicalOperator, PredicateOperator, TriggerConditionField, TriggerEvent, TriggerExecutionStatus, VisitorSessionStatus } from '@prisma/client';
import { TriggersJobData } from './queues/triggers.queue';
import { ChatGateway } from 'src/chat/chat.gateway';
import { SecureIdService } from 'src/common/services/secure-id.service';

@Injectable()
export class TriggersOrchestratorService implements OnModuleInit, OnModuleDestroy {
    private worker: Worker<TriggersJobData> | null = null;

    // Redis key constants
    private readonly REDIS_KEYS = {
        ENABLED_TRIGGERS_SET: (workspaceId: string) => `workspace:${workspaceId}:triggers:enabled`,
        TRIGGER_DATA: (triggerId: string) => `trigger:${triggerId}:data`,
    };

    constructor(
        @Inject('TRIGGERS_QUEUE') private readonly triggersQueue: Queue<TriggersJobData>,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        private readonly secureIdService: SecureIdService,
        private readonly chatGateway: ChatGateway,
    ) { }

    async onModuleInit(): Promise<void> {
        const concurrency = Math.max(4, os.cpus().length * 2);
        this.worker = new Worker<TriggersJobData>(
            this.triggersQueue.name,
            this.processJob,
            {
                connection: this.redis,
                concurrency,
            }
        );
        this.worker.on('completed', (job) => {
            this.logger.log(`Trigger job completed: ${job.id}`, 'TriggersOrchestratorService');
        });
        this.worker.on('failed', (job, err) => {
            this.logger.error(`Trigger job failed: ${job?.id} - ${err?.message}`, undefined, 'TriggersOrchestratorService', err as Error);
        });
        this.logger.log(`Triggers worker started with concurrency ${concurrency}`, 'TriggersOrchestratorService');
    }

    async onModuleDestroy(): Promise<void> {
        if (this.worker) {
            await this.worker.close();
            this.worker = null;
        }
    }

    // Job processor
    private processJob: Processor<TriggersJobData> = async (job: Job<TriggersJobData>) => {
        const { workspaceId, eventType, payload } = job.data;

        // 1) Load enabled triggers for workspace from Redis
        const enabledSetKey = this.REDIS_KEYS.ENABLED_TRIGGERS_SET(workspaceId);
        const triggerIds = await this.redis.smembers(enabledSetKey);
        if (!triggerIds || triggerIds.length === 0) {
            return;
        }

        // 2) Fetch trigger payloads
        const pipeline = this.redis.multi();
        for (const id of triggerIds) {
            pipeline.get(this.REDIS_KEYS.TRIGGER_DATA(id));
        }
        const results = await pipeline.exec();
        const triggers = (results || [])
            .map(([, val]) => (val ? safeParse(val as string) : null))
            .filter((t): t is any => !!t)
            .filter(t => t.enabled && t.event === eventType);

        if (triggers.length === 0) {
            return;
        }

        // 3) Sort by priority desc, group by priority
        triggers.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
        const groups = groupByPriority(triggers);

        // 4) Execute by priority waves with bounded parallelism
        const context: Record<string, any> = { ...payload, __eventType: eventType };
        for (const { priority, items } of groups) {
            await this.runWithConcurrencyLimit(items, 8, async (t) => {
                const shouldRun = await this.evaluateConditions(t, context);
                const chatRoomId = context?.chatRoom?.id || context?.roomId || null;
                const departmentId = t?.departmentId ?? null;
                if (!shouldRun) {
                    return;
                }
                try {
                    await this.executeActions(workspaceId, t, context);
                    await this.logTriggerSuccess(workspaceId, t.id, departmentId, chatRoomId, { result: 'executed' });
                } catch (err) {
                    await this.logTriggerFailure(workspaceId, t.id, departmentId, chatRoomId, err as Error);
                }
            });
            this.logger.log(`Executed priority ${priority} wave for workspace ${workspaceId}`, 'TriggersOrchestratorService');
        }
    };

    private async evaluateConditions(trigger: any, context: Record<string, any>): Promise<boolean> {
        const groups: any[] = Array.isArray(trigger?.conditionGroups) ? trigger.conditionGroups : [];
        if (groups.length === 0) return true;
        const roots = groups.filter((g: any) => !g.parentId);
        if (roots.length === 0) return true;
        for (const root of roots) {
            const ok = await this.evaluateGroup(root, context);
            if (!ok) return false;
        }
        return true;
    }

    private async executeActions(workspaceId: string, trigger: any, context: Record<string, any>): Promise<void> {
        const actions: any[] = Array.isArray(trigger?.actions) ? trigger.actions : [];
        if (actions.length === 0) return;

        const ctx = await this.ensureRoomContext(context);
        const ordered = [...actions].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        for (const action of ordered) {
            await this.runAction(workspaceId, ctx, action);
        }
    }

    private async evaluateGroup(group: any, context: Record<string, any>): Promise<boolean> {
        const op: LogicalOperator = group?.operator as LogicalOperator;
        const conditions: any[] = Array.isArray(group?.conditions) ? group.conditions : [];
        const children: any[] = Array.isArray(group?.children) ? group.children : [];

        const condResults = await Promise.all(conditions.map(c => this.evaluateCondition(c, context)));
        const childResults = await Promise.all(children.map(ch => this.evaluateGroup(ch, context)));
        const parts = [...condResults, ...childResults];

        if (parts.length === 0) return true;
        if (op === LogicalOperator.AND) return parts.every(Boolean);
        return parts.some(Boolean);
    }

    private async evaluateCondition(cond: any, context: Record<string, any>): Promise<boolean> {
        const field: TriggerConditionField = cond?.field as TriggerConditionField;
        const operator: PredicateOperator | undefined = cond?.operator as PredicateOperator;
        const primaryRight =
            cond?.primaryRightBoolean !== undefined && cond?.primaryRightBoolean !== null ? cond.primaryRightBoolean :
                cond?.primaryRightNumber !== undefined && cond?.primaryRightNumber !== null ? cond.primaryRightNumber :
                    cond?.primaryRightString !== undefined && cond?.primaryRightString !== null ? cond.primaryRightString : undefined;
        const secondaryRight =
            cond?.secondaryRightBoolean !== undefined && cond?.secondaryRightBoolean !== null ? cond.secondaryRightBoolean :
                cond?.secondaryRightNumber !== undefined && cond?.secondaryRightNumber !== null ? cond.secondaryRightNumber :
                    cond?.secondaryRightString !== undefined && cond?.secondaryRightString !== null ? cond.secondaryRightString : undefined;

        const left = this.resolveFieldValue(field, context);

        if (operator === undefined) {
            switch (field) {
                case TriggerConditionField.STILL_ON_PAGE:
                    return (new Date().getSeconds() - context.pageVisitedAt) >= primaryRight;
                case TriggerConditionField.STILL_ON_SITE:
                    return (new Date().getSeconds() - context.siteVisitedAt) >= primaryRight;
                case TriggerConditionField.DEPARTMENT_STATUS:
                    const departmentStatus = await this.prisma.department.findUnique({
                        where: {
                            id: primaryRight,
                        },
                        select: {
                            status: true,
                        }
                    });
                    return departmentStatus?.status === (secondaryRight as DepartmentStatus);
                default:
                    return false;
            }
        }

        switch (operator) {
            case PredicateOperator.EQ: return this.eq(left, primaryRight);
            case PredicateOperator.NE: return !this.eq(left, primaryRight);
            case PredicateOperator.LT: return Number(left) < Number(primaryRight);
            case PredicateOperator.LTE: return Number(left) <= Number(primaryRight);
            case PredicateOperator.GT: return Number(left) > Number(primaryRight);
            case PredicateOperator.GTE: return Number(left) >= Number(primaryRight);
            case PredicateOperator.CONTAINS: return this.contains(left, primaryRight, false);
            case PredicateOperator.ICONTAINS: return this.contains(left, primaryRight, true);
            case PredicateOperator.STARTS_WITH: return this.startsWith(left, primaryRight, false);
            case PredicateOperator.ISTARTS_WITH: return this.startsWith(left, primaryRight, true);
            case PredicateOperator.ENDS_WITH: return this.endsWith(left, primaryRight, false);
            case PredicateOperator.IENDS_WITH: return this.endsWith(left, primaryRight, true);
            default: return false;
        }
    }

    private resolveFieldValue(field: TriggerConditionField, ctx: Record<string, any>): any {
        const now = new Date(typeof ctx?.timestamp === 'string' || typeof ctx?.timestamp === 'number' ? new Date(ctx.timestamp) : Date.now());
        const page = ctx.page || {};
        const visitor = ctx.visitor || {};
        switch (field) {
            case TriggerConditionField.HOUR_OF_DAY: return now.getHours();
            case TriggerConditionField.DAY_OF_WEEK: return now.getDay(); // 0..6
            case TriggerConditionField.VISITOR_COUNTRY_CODE: return visitor.countryCode ?? ctx.countryCode;
            case TriggerConditionField.VISITOR_COUNTRY_NAME: return visitor.countryName ?? ctx.countryName;
            case TriggerConditionField.VISITOR_CITY: return visitor.city ?? ctx.city;
            case TriggerConditionField.VISITOR_REGION: return visitor.region ?? ctx.region;
            case TriggerConditionField.VISITOR_PREVIOUS_CHATS: return Number(visitor.previousChats ?? ctx.previousChats ?? 0);
            case TriggerConditionField.VISITOR_PREVIOUS_VISITS: return Number(visitor.previousVisits ?? ctx.previousVisits ?? 0);
            case TriggerConditionField.VISITOR_PAGE_URL: return page.url ?? ctx.pageUrl;
            case TriggerConditionField.VISITOR_PAGE_TITLE: return page.title ?? ctx.pageTitle;
            case TriggerConditionField.VISITOR_PAGE_COUNT: return Number(visitor.pageCount ?? ctx.pageCount ?? 0);
            case TriggerConditionField.VISITOR_PREVIOUS_PAGE: return page.previousUrl ?? ctx.previousPage;
            case TriggerConditionField.VISITOR_NAME: return visitor.name ?? ctx.visitorName ?? ctx.name;
            case TriggerConditionField.VISITOR_EMAIL: return visitor.email ?? ctx.visitorEmail ?? ctx.email;
            case TriggerConditionField.VISITOR_REFERRER: return page.referrer ?? ctx.referrer;
            case TriggerConditionField.VISITOR_SEARCH_ENGINE: return page.searchEngine ?? ctx.searchEngine;
            case TriggerConditionField.VISITOR_SEARCH_TERMS: return page.searchTerms ?? ctx.searchTerms;
            case TriggerConditionField.VISITOR_TAG: return visitor.tag ?? ctx.visitorTag;
            case TriggerConditionField.VISITOR_DEPARTMENT: return visitor.departmentId ?? ctx.visitorDepartmentId ?? ctx.departmentId;
            case TriggerConditionField.VISITOR_USER_AGENT: return visitor.userAgent ?? ctx.userAgent;
            case TriggerConditionField.VISITOR_BROWSER: return visitor.browser ?? ctx.browser;
            case TriggerConditionField.VISITOR_PLATFORM: return visitor.platform ?? ctx.platform;
            case TriggerConditionField.ACCOUNT_STATUS: return ctx.accountStatus;
            case TriggerConditionField.VISITOR_STATUS: return ctx.visitorStatus;
            case TriggerConditionField.VISITOR_IS_CHATTING: return !!ctx.isChatting;
            case TriggerConditionField.VISITOR_INCOMING_REQUEST: return ctx.__eventType === 'incoming_request';
            case TriggerConditionField.VISITOR_CURRENTLY_SERVED: return !!ctx.currentlyServed;
            case TriggerConditionField.SENDER: return ctx.userId ?? ctx.visitorId ?? ctx.senderId;
            case TriggerConditionField.SENDER_TYPE: return ctx.senderType;
            case TriggerConditionField.MESSAGE: return ctx.content ?? ctx.message?.content;
            case TriggerConditionField.QUEUE_SIZE: return Number(ctx.queueSize ?? 0);
            default: return undefined;
        }
    }

    private eq(left: any, right: any): boolean {
        if (typeof left === 'boolean' || typeof right === 'boolean') {
            return Boolean(left) === Boolean(right);
        }
        if (left == null || right == null) return left === right;
        if (typeof left === 'number' || typeof right === 'number') {
            const ln = Number(left); const rn = Number(right);
            if (Number.isNaN(ln) || Number.isNaN(rn)) return String(left) === String(right);
            return ln === rn;
        }
        return String(left) === String(right);
    }

    private contains(left: any, right: any, ci: boolean): boolean {
        if (left == null || right == null) return false;
        const l = String(left); const r = String(right);
        return ci ? l.toLowerCase().includes(r.toLowerCase()) : l.includes(r);
    }

    private startsWith(left: any, right: any, ci: boolean): boolean {
        if (left == null || right == null) return false;
        const l = String(left); const r = String(right);
        return ci ? l.toLowerCase().startsWith(r.toLowerCase()) : l.startsWith(r);
    }

    private endsWith(left: any, right: any, ci: boolean): boolean {
        if (left == null || right == null) return false;
        const l = String(left); const r = String(right);
        return ci ? l.toLowerCase().endsWith(r.toLowerCase()) : l.endsWith(r);
    }

    private async ensureRoomContext(context: Record<string, any>): Promise<Record<string, any>> {
        if (context?.chatRoom?.id && context?.chatRoom?.visitorSessionId && context?.chatRoom?.visitorId && context?.chatRoom?.workspaceId) {
            return context;
        }
        const roomId = context?.roomId || context?.chatRoomId;
        if (!roomId) return context;

        const chatRoom = await this.prisma.chatRoom.findUnique({
            where: { id: roomId },
            include: {
                visitorSession: {
                    include: { visitor: true, tags: true },
                },
                visitor: true,
                workspace: true,
            },
        });

        if (chatRoom) {
            return { ...context, chatRoom };
        }
        return context;
    }

    private async runAction(workspaceId: string, context: Record<string, any>, action: any): Promise<void> {
        switch (action.type as ActionType) {
            case ActionType.WAIT:
                await this.actionWait(action);
                break;
            case ActionType.SEND_MESSAGE_TO_VISITOR:
                await this.actionSendMessageToVisitor(context, action);
                break;
            case ActionType.SET_NAME_OF_VISITOR:
                await this.actionSetVisitorName(context, action);
                break;
            case ActionType.ADD_TAG:
                await this.actionAddTag(workspaceId, context, action);
                break;
            case ActionType.REMOVE_TAG:
                await this.actionRemoveTag(workspaceId, context, action);
                break;
            case ActionType.SET_VISITOR_DEPARTMENT:
                await this.actionSetVisitorDepartment(context, action);
                break;
            case ActionType.REPLACE_NOTE:
                await this.actionReplaceNote(context, action);
                break;
            case ActionType.APPEND_NOTE:
                await this.actionAppendNote(context, action);
                break;
            default:
                this.logger.warn(`Unknown action type: ${action.type}`, 'TriggersOrchestratorService');
        }
    }

    private async actionWait(action: any): Promise<void> {
        const seconds = Number(action?.primaryIntValue ?? 0);
        if (!Number.isFinite(seconds) || seconds <= 0) return;
        await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    private async actionSendMessageToVisitor(context: Record<string, any>, action: any): Promise<void> {
        const room = context?.chatRoom;
        if (!room?.id) return;
        const vars = await this.buildTemplateVariables(context);
        const content = this.renderTemplate(String(action?.secondaryStringValue ?? '').trim(), vars);
        if (!content) return;
        const senderName = this.renderTemplate(String(action?.primaryStringValue ?? 'System'), vars);

        const messageId = this.secureIdService.generateSecureUuid();

        this.chatGateway.broadcastSystemMessage(context?.workspaceId, room.id, messageId, content, senderName, new Date());
    }

    private async actionSetVisitorName(context: Record<string, any>, action: any): Promise<void> {
        const room = context?.chatRoom;
        const visitorId = room?.visitorId || room?.visitorSession?.visitorId || room?.visitor?.id;
        const workspaceId = room?.workspaceId || room?.workspace?.id;
        const vars = await this.buildTemplateVariables(context);
        const name = this.renderTemplate(String(action?.primaryStringValue ?? '').trim(), vars);
        if (!visitorId || !workspaceId || !name) return;

        await this.prisma.visitor.update({
            where: { id: visitorId },
            data: { name },
        });

        this.chatGateway.updateVisitorQueuesForWorkspace(workspaceId, room?.currentServingDepartmentId);
    }

    private async actionAddTag(workspaceId: string, context: Record<string, any>, action: any): Promise<void> {
        const room = context?.chatRoom;
        if (!room?.id) return;
        const vars = await this.buildTemplateVariables(context);
        const name = this.renderTemplate(String(action?.primaryStringValue ?? '').trim(), vars);
        if (!name) return;

        // Ensure tag exists (system tag)
        let tag = await this.prisma.tag.findFirst({
            where: { workspaceId, name, isSystem: true },
        });
        if (!tag) {
            tag = await this.prisma.tag.create({
                data: {
                    workspaceId,
                    name,
                    color: '#e5e7eb',
                    isSystem: true,
                },
            });
        }

        // Attach to conversation if not active
        const existing = await this.prisma.conversationTag.findFirst({
            where: {
                conversationId: room.id,
                tagId: tag.id,
            },
        });
        if (!existing) {
            await this.prisma.conversationTag.create({
                data: {
                    conversationId: room.id,
                    tagId: tag.id,
                },
            });
        } else {
            await this.prisma.conversationTag.update({
                where: { id: existing.id },
                data: {
                    assignedAt: new Date(),
                    removedAt: null,
                },
            });
        }

        this.chatGateway.updateVisitorQueuesForWorkspace(workspaceId, room?.currentServingDepartmentId);
    }

    private async actionRemoveTag(workspaceId: string, context: Record<string, any>, action: any): Promise<void> {
        const room = context?.chatRoom;
        if (!room?.id) return;
        const vars = await this.buildTemplateVariables(context);
        const name = this.renderTemplate(String(action?.primaryStringValue ?? '').trim(), vars);
        if (!name) return;

        const tag = await this.prisma.tag.findFirst({
            where: { workspaceId, name, isSystem: true },
            select: { id: true },
        });
        if (!tag) return;

        const existing = await this.prisma.conversationTag.findFirst({
            where: {
                conversationId: room.id,
                tagId: tag.id,
                removedAt: null,
            },
            select: { id: true },
        });
        if (!existing) return;

        await this.prisma.conversationTag.update({
            where: { id: existing.id },
            data: {
                removedAt: new Date(),
            },
        });

        this.chatGateway.updateVisitorQueuesForWorkspace(workspaceId, room?.currentServingDepartmentId);
    }

    private async actionSetVisitorDepartment(context: Record<string, any>, action: any): Promise<void> {
        const room = context?.chatRoom;
        if (!room?.id) return;
        const departmentId = action?.primaryStringValue;
        if (!departmentId) return;

        await this.prisma.chatRoom.update({
            where: { id: room.id },
            data: { currentServingDepartmentId: departmentId },
        });

        this.chatGateway.updateVisitorQueuesForWorkspace(context?.workspaceId, room?.currentServingDepartmentId);
    }

    private async actionReplaceNote(context: Record<string, any>, action: any): Promise<void> {
        const room = context?.chatRoom;
        const visitorId = room?.visitorId || room?.visitorSession?.visitorId || room?.visitor?.id;
        if (!visitorId) return;
        const vars = await this.buildTemplateVariables(context);
        const note = this.renderTemplate(String(action?.primaryStringValue ?? ''), vars);

        await this.prisma.visitor.update({
            where: { id: visitorId },
            data: { notes: note },
        });
    }

    private async actionAppendNote(context: Record<string, any>, action: any): Promise<void> {
        const room = context?.chatRoom;
        const visitorId = room?.visitorId || room?.visitorSession?.visitorId || room?.visitor?.id;
        if (!visitorId) return;
        const vars = await this.buildTemplateVariables(context);
        const toAppend = this.renderTemplate(String(action?.primaryStringValue ?? ''), vars);
        if (!toAppend) return;

        const current = await this.prisma.visitor.findUnique({
            where: { id: visitorId },
            select: { notes: true },
        });

        const combined = current?.notes ? `${current.notes}\n${toAppend}` : toAppend;

        await this.prisma.visitor.update({
            where: { id: visitorId },
            data: { notes: combined },
        });
    }

    private async buildTemplateVariables(context: Record<string, any>): Promise<Record<string, string>> {
        const vars: Record<string, string> = {};
        const now = new Date();
        const hourUtc = now.getUTCHours();
        const dayUtc = now.getUTCDay(); // 0..6 (0=Sun)
        const mondayZero = (dayUtc + 6) % 7; // 0=Mon, 6=Sun
        vars['hour_of_day'] = String(hourUtc);
        const dayOfWeek = mondayZero === 0 ? 'Monday' : mondayZero === 1 ? 'Tuesday' : mondayZero === 2 ? 'Wednesday' : mondayZero === 3 ? 'Thursday' : mondayZero === 4 ? 'Friday' : mondayZero === 5 ? 'Saturday' : 'Sunday';
        vars['day_of_week'] = dayOfWeek;

        const room = context?.chatRoom;
        const session = room?.visitorSession;
        const visitor = session?.visitor || room?.visitor;

        // Visitor/session basics
        vars['visitor_ip'] = session?.ipAddress || '';
        vars['visitor_hostname'] = session?.hostName || context?.visitorHostname || '';
        vars['visitor_name'] = visitor?.name || '';
        vars['visitor_previous_visits'] = String(visitor?.sessionCount ?? 0);
        vars['visitor_previous_chats'] = String(visitor?.totalChats ?? 0);
        vars['visitor_user_agent'] = session?.userAgent || '';
        vars['visitor_status'] = this.mapVisitorStatus(session) || '';
        vars['visitor_requesting_chat'] = String((context?.__eventType === 'incoming_request') || (session?.status === 'INCOMING'));
        vars['visitor_served'] = String(Boolean(room?.primaryAgentId || session?.status === 'CURRENTLY_SERVED'));
        vars['account_status'] = context?.accountStatus || '';

        // Tags (visitor/session tags)
        const visitorTags = Array.isArray(session?.tags) ? session!.tags.map((t: any) => t.name).filter(Boolean) : [];
        vars['visitor_tags'] = visitorTags.join(', ');

        // Location (JSON) best-effort extraction
        const loc = session?.location || {};
        vars['visitor_city'] = this.getFromLocation(loc, ['city', 'cityName']) || '';
        vars['visitor_region'] = this.getFromLocation(loc, ['region', 'regionName', 'state']) || '';
        vars['visitor_country_code'] = this.getFromLocation(loc, ['countryCode', 'country_code', 'cc']) || '';
        vars['visitor_country_name'] = this.getFromLocation(loc, ['country', 'countryName']) || '';

        // Page info (prefer context first)
        vars['visitor_page_url'] = context?.page?.url || context?.pageUrl || '';
        vars['visitor_page_title'] = context?.page?.title || context?.pageTitle || '';
        vars['visitor_referrer'] = context?.page?.referrer || context?.referrer || '';
        vars['visitor_search_engine'] = context?.page?.searchEngine || context?.searchEngine || '';
        vars['visitor_search_terms'] = context?.page?.searchTerms || context?.searchTerms || '';

        // Try to hydrate from VisitorPageTracking if sessionId present and page data missing
        if (session?.id && (!vars['visitor_page_url'] || !vars['visitor_page_title'])) {
            const tracking = await this.prisma.visitorPageTracking.findUnique({
                where: { sessionId: session.id },
                select: { pageUrl: true, pageTitle: true, timeOnPage: true, viewedAt: true },
            }).catch(() => null);
            if (tracking) {
                vars['visitor_page_url'] = vars['visitor_page_url'] || tracking.pageUrl || '';
                vars['visitor_page_title'] = vars['visitor_page_title'] || tracking.pageTitle || '';
                if (tracking.timeOnPage != null) {
                    vars['visitor_time_on_page'] = String(tracking.timeOnPage);
                }
            }
        }

        // Time on site (seconds)
        if (session?.startedAt) {
            const diffSec = Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000));
            vars['visitor_time_on_site'] = String(diffSec);
        } else {
            vars['visitor_time_on_site'] = vars['visitor_time_on_site'] || '0';
        }

        // Page count if provided, else leave blank
        vars['visitor_page_count'] = String(context?.pageCount ?? context?.visitor?.pageCount ?? '');

        // Browser/platform if available
        vars['visitor_browser'] = context?.browser || '';
        vars['visitor_platform'] = context?.platform || '';

        return vars;
    }

    private renderTemplate(template: string, vars: Record<string, string>): string {
        if (!template) return template;
        return template.replace(/@([a-z_]+)/gi, (match, p1) => {
            const key = String(p1 || '').toLowerCase();
            if (Object.prototype.hasOwnProperty.call(vars, key)) {
                return vars[key] ?? '';
            }
            return match;
        });
    }

    private mapVisitorStatus(session: any): string {
        if (!session) return '';
        if (session.endedAt) return 'offline';
        switch (session.status as VisitorSessionStatus) {
            case 'ACTIVE': return 'online';
            case 'IDLE': return 'idle';
            case 'AWAY': return 'away';
            default: return String(session.status || '').toLowerCase();
        }
    }

    private getFromLocation(loc: any, keys: string[]): string {
        for (const k of keys) {
            if (loc && loc[k] != null) return String(loc[k]);
        }
        return '';
    }

    private async logTriggerSuccess(
        workspaceId: string,
        triggerId: string,
        departmentId: string | null,
        chatRoomId: string | null,
        detail?: any,
    ): Promise<void> {
        const existing = await this.prisma.triggerExecutionLog.findFirst({ where: { triggerId } });
        const now = new Date();
        if (existing) {
            await this.prisma.triggerExecutionLog.update({
                where: { id: existing.id },
                data: {
                    currentStatus: TriggerExecutionStatus.SUCCESS,
                    totalExecutions: { increment: 1 },
                    totalSuccesses: { increment: 1 },
                    lastTriggeredAt: now,
                    executionDetails: Object.assign(
                        {},
                        existing.executionDetails ?? {},
                        {
                            lastSuccessAt: now.toISOString(),
                            lastDetail: detail ?? null,
                        }
                    ),
                },
            });
        } else {
            await this.prisma.triggerExecutionLog.create({
                data: {
                    workspaceId,
                    departmentId,
                    triggerId,
                    chatRoomId,
                    currentStatus: TriggerExecutionStatus.SUCCESS,
                    totalExecutions: 1,
                    totalSuccesses: 1,
                    totalFailures: 0,
                    lastTriggeredAt: now,
                    executionDetails: { lastSuccessAt: now.toISOString(), lastDetail: detail ?? null },
                },
            });
        }
    }

    private async logTriggerFailure(
        workspaceId: string,
        triggerId: string,
        departmentId: string | null,
        chatRoomId: string | null,
        error: Error,
    ): Promise<void> {
        const existing = await this.prisma.triggerExecutionLog.findFirst({ where: { triggerId } });
        const now = new Date();
        if (existing) {
            await this.prisma.triggerExecutionLog.update({
                where: { id: existing.id },
                data: {
                    currentStatus: TriggerExecutionStatus.FAILED,
                    totalExecutions: { increment: 1 },
                    totalFailures: { increment: 1 },
                    lastTriggeredAt: now,
                    executionDetails: Object.assign(
                        {},
                        existing.executionDetails ?? {},
                        {
                            lastFailureAt: now.toISOString(),
                            lastError: error?.message ?? 'Unknown error',
                        }
                    ),
                },
            });
        } else {
            await this.prisma.triggerExecutionLog.create({
                data: {
                    workspaceId,
                    departmentId,
                    triggerId,
                    chatRoomId,
                    currentStatus: TriggerExecutionStatus.FAILED,
                    totalExecutions: 1,
                    totalSuccesses: 0,
                    totalFailures: 1,
                    lastTriggeredAt: now,
                    executionDetails: {
                        lastFailureAt: now.toISOString(),
                        lastError: error?.message ?? 'Unknown error',
                    },
                },
            });
        }
    }

    private async runWithConcurrencyLimit<T>(
        items: T[],
        limit: number,
        runner: (item: T) => Promise<void>,
    ): Promise<void> {
        const concurrency = Math.max(1, Math.min(limit, items.length));
        let index = 0;

        const workers = Array.from({ length: concurrency }, async () => {
            while (true) {
                const current = index++;
                if (current >= items.length) break;
                try {
                    await runner(items[current]);
                } catch {
                    // swallow; errors should be handled/logged in runner
                }
            }
        });

        await Promise.all(workers);
    }
}

function safeParse(s: string): any | null {
    try { return JSON.parse(s); } catch { return null; }
}

function groupByPriority(items: any[]): Array<{ priority: number; items: any[] }> {
    const map = new Map<number, any[]>();
    for (const t of items) {
        const p = Number.isFinite(t.priority) ? t.priority : 0;
        const arr = map.get(p) || [];
        arr.push(t);
        map.set(p, arr);
    }
    return Array.from(map.entries())
        .map(([priority, items]) => ({ priority, items }))
        .sort((a, b) => b.priority - a.priority);
}