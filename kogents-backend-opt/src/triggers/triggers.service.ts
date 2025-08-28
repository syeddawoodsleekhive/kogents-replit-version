import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { Prisma, ActionType, PredicateOperator, TriggerConditionField, LogicalOperator, TriggerEvent } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { CreateTriggerDto, ConditionNodeDto, TriggerActionDto } from './dtos/create-trigger.dto';
import { FindTriggersDto } from './dtos/find-triggers.dto';
import { UpdateTriggerDto, UpdateConditionNodeDto, UpdateTriggerActionDto } from './dtos/update-trigger.dto';
import { Redis } from 'ioredis';

@Injectable()
export class TriggersService {
    // Redis key constants
    private readonly REDIS_KEYS = {
        ENABLED_TRIGGERS_SET: (workspaceId: string) => `workspace:${workspaceId}:triggers:enabled`,
        TRIGGER_DATA: (triggerId: string) => `trigger:${triggerId}:data`,
    };

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
    ) { }

    async createTrigger(workspaceId: string, dto: CreateTriggerDto, createdBy?: string) {
        // Validate workspace
        const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
        if (!workspace) {
            throw new NotFoundException('Workspace not found');
        }

        if (dto.departmentId) {
            const department = await this.prisma.department.findFirst({ where: { id: dto.departmentId, workspaceId: workspaceId } });
            if (!department) {
                throw new NotFoundException('Department not found in workspace');
            }
        }

        // Normalize and validate actions
        const actionsData = (dto.actions ?? []).map(a => ({
            type: a.type,
            sortOrder: a.sortOrder ?? 0,
            primaryIntValue: a.primaryIntValue ?? null,
            primaryStringValue: a.primaryStringValue ?? null,
            primaryBooleanValue: a.primaryBooleanValue ?? null,
            secondaryIntValue: a.secondaryIntValue ?? null,
            secondaryStringValue: a.secondaryStringValue ?? null,
            secondaryBooleanValue: a.secondaryBooleanValue ?? null,
        }));

        const full = await this.prisma.$transaction(async (tx) => {
            // Create trigger without actions first
            const created = await tx.trigger.create({
                data: {
                    workspaceId: workspaceId,
                    departmentId: dto.departmentId ?? null,
                    name: dto.name,
                    description: dto.description ?? null,
                    event: dto.triggerEvent,
                    enabled: dto.enabled,
                    priority: dto.priority,
                    createdBy: createdBy ?? null,
                },
            });

            // Build condition groups + conditions recursively
            const rootGroupOperator = this.detectGroupOperator(dto.conditions);
            if (!rootGroupOperator) {
                throw new BadRequestException('Root conditions must contain AND or OR');
            }
            await this.createConditionTreeTx(tx, created.id, null, dto.conditions, rootGroupOperator, 0);

            // Create actions referencing triggerId explicitly
            if (actionsData.length > 0) {
                await tx.triggerAction.createMany({
                    data: actionsData.map(a => ({ ...a, triggerId: created.id })),
                });
            }

            // Return full record
            return tx.trigger.findUnique({
                where: { id: created.id },
                include: {
                    conditionGroups: {
                        include: { conditions: true, children: { include: { conditions: true, children: true } } },
                        orderBy: { sortOrder: 'asc' },
                    },
                    actions: {
                        orderBy: { sortOrder: 'asc' },
                    },
                },
            });
        });

        if (!full) {
            throw new NotFoundException('Failed to load created trigger');
        }

        // Cache if enabled
        if (full.enabled) {
            await this.addTriggerToCache(full.workspaceId, full);
        }

        this.logger.log(`Trigger created: ${full.id} in workspace ${workspaceId}`, 'TriggersService');
        return full;
    }

    async findTriggers(workspaceId: string, query: FindTriggersDto) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
        const skip = (page - 1) * limit;

        const where: Prisma.TriggerWhereInput = {
            workspaceId,
            ...(query.departmentId ? { departmentId: query.departmentId } : {}),
        };

        const [items, total, activeCount, execAgg] = await this.prisma.$transaction([
            this.prisma.trigger.findMany({
                where,
                orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
                skip,
                take: limit,
                include: {
                    actions: {
                        orderBy: { sortOrder: 'asc' },
                    },
                    conditionGroups: {
                        orderBy: { sortOrder: 'asc' },
                        include: { conditions: true, children: { include: { conditions: true, children: true } } },
                    },
                },
            }),
            this.prisma.trigger.count({ where }),
            this.prisma.trigger.count({ where: { ...where, enabled: true } }),
            this.prisma.triggerExecutionLog.groupBy({
                by: ['workspaceId'],
                orderBy: { workspaceId: 'asc' },
                where: {
                    workspaceId,
                    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
                },
                _sum: { totalExecutions: true, totalSuccesses: true, totalFailures: true },
            }),
        ]);

        const totalExecutions = execAgg[0]?._sum?.totalExecutions ?? 0;
        const totalSuccesses = execAgg[0]?._sum?.totalSuccesses ?? 0;
        const successRate = totalExecutions > 0 ? totalSuccesses / totalExecutions : 0;

        // Per-trigger metrics
        const triggerIds = items.map(i => i.id);
        const perTrigger = triggerIds.length > 0
            ? await this.prisma.triggerExecutionLog.findMany({
                where: { triggerId: { in: triggerIds }, workspaceId, ...(query.departmentId ? { departmentId: query.departmentId } : {}) },
                select: { triggerId: true, totalExecutions: true, lastTriggeredAt: true },
            })
            : [];
        const execMap = new Map<string, { totalExecutions: number, lastTriggeredAt: Date | null }>();
        for (const row of perTrigger) execMap.set(row.triggerId, { totalExecutions: row.totalExecutions, lastTriggeredAt: row.lastTriggeredAt ?? null });

        const responseItems = items.map(t => ({
            id: t.id,
            name: t.name,
            enabled: t.enabled,
            description: t.description,
            priority: t.priority,
            conditions: t.conditionGroups,
            actions: t.actions,
            totalExecutions: execMap.get(t.id)?.totalExecutions ?? 0,
            lastTriggeredAt: execMap.get(t.id)?.lastTriggeredAt ?? null,
        }));

        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
            metrics: {
                totalTriggers: total,
                activeTriggers: activeCount,
                totalExecutions,
                successRate,
            },
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            triggers: responseItems,
        };
    }

    async updateTrigger(workspaceId: string, triggerId: string, dto: UpdateTriggerDto) {
        const existing = await this.prisma.trigger.findFirst({ where: { id: triggerId, workspaceId } });
        if (!existing) {
            throw new NotFoundException('Trigger not found');
        }

        if (dto.departmentId) {
            const department = await this.prisma.department.findFirst({ where: { id: dto.departmentId, workspaceId } });
            if (!department) {
                throw new NotFoundException('Department not found in workspace');
            }
        }

        const updated = await this.prisma.$transaction(async (tx) => {
            // Update basic fields
            await tx.trigger.update({
                where: { id: triggerId },
                data: {
                    ...(dto.name !== undefined && { name: dto.name }),
                    ...(dto.description !== undefined && { description: dto.description }),
                    ...(dto.triggerEvent !== undefined && { event: dto.triggerEvent }),
                    ...(dto.enabled !== undefined && { enabled: dto.enabled }),
                    ...(dto.priority !== undefined && { priority: dto.priority }),
                    ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
                },
            });

            // Replace conditions if provided: delete old groups/conditions and recreate
            if (dto.conditions !== undefined) {
                await tx.triggerCondition.deleteMany({ where: { group: { triggerId } } });
                await tx.triggerConditionGroup.deleteMany({ where: { triggerId } });

                const rootOp = this.detectGroupOperator(dto.conditions as any);
                if (!rootOp) {
                    throw new BadRequestException('Root conditions must contain AND or OR');
                }
                await this.createConditionTreeTx(tx, triggerId, null, dto.conditions as any, rootOp, 0);
            }

            // Replace actions if provided
            if (dto.actions !== undefined) {
                await tx.triggerAction.deleteMany({ where: { triggerId } });
                if (dto.actions.length > 0) {
                    const actionsToCreate = dto.actions.map(a => ({
                        type: (a.type as any) ?? undefined,
                        sortOrder: a.sortOrder ?? 0,
                        primaryIntValue: a.primaryIntValue ?? null,
                        primaryStringValue: a.primaryStringValue ?? null,
                        primaryBooleanValue: a.primaryBooleanValue ?? null,
                        secondaryIntValue: a.secondaryIntValue ?? null,
                        secondaryStringValue: a.secondaryStringValue ?? null,
                        secondaryBooleanValue: a.secondaryBooleanValue ?? null,
                        triggerId,
                    }));
                    await tx.triggerAction.createMany({ data: actionsToCreate as any });
                }
            }

            return tx.trigger.findUnique({
                where: { id: triggerId },
                include: {
                    actions: {
                        orderBy: { sortOrder: 'asc' },
                    },
                    conditionGroups: {
                        orderBy: { sortOrder: 'asc' },
                        include: { conditions: true, children: { include: { conditions: true, children: true } } },
                    },
                },
            });
        });

        if (!updated) {
            throw new NotFoundException('Failed to load updated trigger');
        }

        // Sync cache based on updated state
        await this.syncTriggerCache(updated);

        return updated;
    }

    async deleteTrigger(workspaceId: string, triggerId: string) {
        const existing = await this.prisma.trigger.findFirst({ where: { id: triggerId, workspaceId } });
        if (!existing) {
            throw new NotFoundException('Trigger not found');
        }
        await this.prisma.$transaction([
            this.prisma.triggerCondition.deleteMany({ where: { group: { triggerId } } }),
            this.prisma.triggerConditionGroup.deleteMany({ where: { triggerId } }),
            this.prisma.triggerAction.deleteMany({ where: { triggerId } }),
            this.prisma.trigger.delete({ where: { id: triggerId } }),
        ]);

        // Remove from cache (idempotent)
        await this.removeTriggerFromCache(existing.workspaceId, triggerId);

        return { success: true };
    }

    async updateTriggerStatus(workspaceId: string, triggerId: string, enabled: boolean, departmentId?: string) {

        const trigger = await this.prisma.trigger.findUnique({ where: { id: triggerId, workspaceId, departmentId } });

        if (!trigger) {
            throw new NotFoundException('Trigger not found');
        }

        const updated = await this.prisma.trigger.update({
            where: { id: triggerId }, data: { enabled }, include: {
                actions: {
                    orderBy: { sortOrder: 'asc' },
                },
                conditionGroups: {
                    orderBy: { sortOrder: 'asc' },
                    include: { conditions: true, children: { include: { conditions: true, children: true } } },
                },
            }
        });

        await this.syncTriggerCache(updated);

        return updated;
    }

    private detectGroupOperator(node: ConditionNodeDto): LogicalOperator | null {
        if (node.AND && node.AND.length > 0) return LogicalOperator.AND;
        if (node.OR && node.OR.length > 0) return LogicalOperator.OR;
        return null;
    }

    private isLeaf(node: ConditionNodeDto): boolean {
        return !!node.field && !!node.operator && node.primaryValue !== undefined;
    }

    private inferRightValueColumns(value: string | number | boolean): { primaryRightString?: string | null; primaryRightNumber?: number | null; primaryRightBoolean?: boolean | null; secondaryRightString?: string | null; secondaryRightNumber?: number | null; secondaryRightBoolean?: boolean | null } {
        if (typeof value === 'string') return { primaryRightString: value, primaryRightNumber: null, primaryRightBoolean: null, secondaryRightString: null, secondaryRightNumber: null, secondaryRightBoolean: null };
        if (typeof value === 'number') return { primaryRightString: null, primaryRightNumber: value, primaryRightBoolean: null, secondaryRightString: null, secondaryRightNumber: null, secondaryRightBoolean: null };
        if (typeof value === 'boolean') return { primaryRightString: null, primaryRightNumber: null, primaryRightBoolean: value, secondaryRightString: null, secondaryRightNumber: null, secondaryRightBoolean: null };
        throw new BadRequestException('Unsupported right value type');
    }

    private async createConditionTreeTx(
        tx: Prisma.TransactionClient,
        triggerId: string,
        parentGroupId: string | null,
        node: ConditionNodeDto,
        currentOperator: LogicalOperator,
        siblingIndex: number,
    ): Promise<void> {
        // Create a group for this node (represents AND/OR grouping)
        const group = await tx.triggerConditionGroup.create({
            data: {
                triggerId,
                parentId: parentGroupId,
                operator: currentOperator,
                sortOrder: siblingIndex,
            },
        });

        // If this node is a leaf, create a single condition under this group
        if (this.isLeaf(node)) {
            const { primaryRightString, primaryRightNumber, primaryRightBoolean, secondaryRightString, secondaryRightNumber, secondaryRightBoolean } = this.inferRightValueColumns(node.primaryValue as any);
            await tx.triggerCondition.create({
                data: {
                    groupId: group.id,
                    operator: node.operator,
                    field: node.field!,
                    sortOrder: 0,
                    primaryRightString,
                    primaryRightNumber,
                    primaryRightBoolean,
                    secondaryRightString,
                    secondaryRightNumber,
                    secondaryRightBoolean,
                },
            });
            return;
        }

        // Otherwise, expand children based on AND/OR arrays
        const children: ConditionNodeDto[] = (currentOperator === LogicalOperator.AND ? (node.AND ?? []) : (node.OR ?? []));
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (this.isLeaf(child)) {
                const { primaryRightString, primaryRightNumber, primaryRightBoolean, secondaryRightString, secondaryRightNumber, secondaryRightBoolean } = this.inferRightValueColumns(child.primaryValue as any);
                await tx.triggerCondition.create({
                    data: {
                        groupId: group.id,
                        operator: child.operator,
                        field: child.field!,
                        sortOrder: i,
                        primaryRightString,
                        primaryRightNumber,
                        primaryRightBoolean,
                        secondaryRightString,
                        secondaryRightNumber,
                        secondaryRightBoolean,
                    },
                });
            } else {
                const nextOp = this.detectGroupOperator(child);
                if (!nextOp) {
                    throw new BadRequestException('Nested group must contain AND or OR');
                }
                await this.createConditionTreeTx(tx, triggerId, group.id, child, nextOp, i);
            }
        }
    }

    // Redis cache helpers
    private async addTriggerToCache(workspaceId: string, trigger: any): Promise<void> {
        try {
            const pipeline = this.redis.multi();
            const triggerKey = this.REDIS_KEYS.TRIGGER_DATA(trigger.id);
            const enabledSetKey = this.REDIS_KEYS.ENABLED_TRIGGERS_SET(workspaceId);

            // Store full trigger structure needed for evaluation
            const payload = JSON.stringify({
                id: trigger.id,
                workspaceId: trigger.workspaceId,
                departmentId: trigger.departmentId ?? null,
                name: trigger.name,
                description: trigger.description ?? null,
                event: trigger.event,
                enabled: trigger.enabled,
                priority: trigger.priority,
                conditionGroups: trigger.conditionGroups ?? [],
                actions: trigger.actions ?? [],
            });

            pipeline.set(triggerKey, payload);
            pipeline.sadd(enabledSetKey, trigger.id);
            await pipeline.exec();

            this.logger.log(`Cached enabled trigger ${trigger.id} for workspace ${workspaceId}`, 'TriggersService');
        } catch (err) {
            this.logger.error(`Failed to cache trigger ${trigger.id}: ${(err as Error).message}`, err, 'TriggersService');
        }
    }

    private async removeTriggerFromCache(workspaceId: string, triggerId: string): Promise<void> {
        try {
            const pipeline = this.redis.multi();
            pipeline.srem(this.REDIS_KEYS.ENABLED_TRIGGERS_SET(workspaceId), triggerId);
            pipeline.del(this.REDIS_KEYS.TRIGGER_DATA(triggerId));
            await pipeline.exec();

            this.logger.log(`Removed trigger ${triggerId} from cache for workspace ${workspaceId}`, 'TriggersService');
        } catch (err) {
            this.logger.error(`Failed to remove trigger ${triggerId} from cache: ${(err as Error).message}`, err, 'TriggersService');
        }
    }

    private async syncTriggerCache(trigger: any): Promise<void> {
        if (trigger.enabled) {
            await this.addTriggerToCache(trigger.workspaceId, trigger);
        } else {
            await this.removeTriggerFromCache(trigger.workspaceId, trigger.id);
        }
    }
}