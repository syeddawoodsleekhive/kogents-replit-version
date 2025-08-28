// src/chat/services/ai-bridge.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';
import WebSocket from 'ws';
import { ConfigService } from '@nestjs/config';

type AiSession = {
    ws: WebSocket;
    active: boolean;
    roomId: string;
    workspaceId: string;
};

@Injectable()
export class AiBridgeService {
    private sessions = new Map<string, AiSession>();

    constructor(
        private readonly logger: AppLoggerService,
        private readonly configService: ConfigService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
    ) { }

    private key(workspaceId: string, roomId: string) {
        return `${workspaceId}:${roomId}`;
    }

    async activateForRoom(workspaceId: string, roomId: string, context?: any) {
        const k = this.key(workspaceId, roomId);
        await this.redis.set(`ai:active:${k}`, '1');
        await this.ensureSession(workspaceId, roomId, context);
        const session = this.sessions.get(k);
        if (session) session.active = true;
    }

    async deactivateForRoom(workspaceId: string, roomId: string) {
        const k = this.key(workspaceId, roomId);
        await this.redis.del(`ai:active:${k}`);
        const session = this.sessions.get(k);
        if (session) session.active = false;
    }

    async sendVisitorMessage(workspaceId: string, roomId: string, payload: { text: string; sessionId: string; meta?: any }) {
        const k = this.key(workspaceId, roomId);
        const isActive = !!(await this.redis.get(`ai:active:${k}`));
        if (!isActive) return;

        const session = await this.ensureSession(workspaceId, roomId);
        if (session.ws.readyState === WebSocket.OPEN) {
            session.ws.send(JSON.stringify({ type: 'visitor_message', workspaceId, roomId, ...payload }));
        }
    }

    private async ensureSession(workspaceId: string, roomId: string, context?: any): Promise<AiSession> {
        const k = this.key(workspaceId, roomId);
        const existing = this.sessions.get(k);
        if (existing && existing.ws.readyState === WebSocket.OPEN) return existing;

        const ws = new WebSocket(this.configService.get<string>('websocket.aiSocketUrl')!, { /* headers/auth if needed */ });
        const aiSession: AiSession = { ws, active: true, roomId, workspaceId };
        this.sessions.set(k, aiSession);

        ws.on('open', () => {
            this.logger.log(`AI session open for ${k}`, 'AiBridgeService');
            if (context) {
                ws.send(JSON.stringify({ type: 'init', workspaceId, roomId, context }));
            }
        });

        ws.on('message', async (raw) => {
            try {
                const msg = JSON.parse(raw.toString());
                // Emit to an application-level handler via callback/event emitter,
                // e.g., this.onAiMessage?.(workspaceId, roomId, msg)
                // You’ll wire this in the module to call ChatService + Gateway emit.
            } catch (e) {
                this.logger.error(`AI message parse error for ${k}: ${e.message}`, 'AiBridgeService');
            }
        });

        ws.on('close', () => this.logger.warn(`AI session closed for ${k}`, 'AiBridgeService'));
        ws.on('error', (err) => this.logger.error(`AI session error for ${k}: ${err.message}`, 'AiBridgeService'));

        return aiSession;
    }
}