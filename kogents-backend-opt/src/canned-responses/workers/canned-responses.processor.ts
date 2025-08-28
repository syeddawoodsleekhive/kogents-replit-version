import { Injectable, Inject } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { CannedResponsesJobData } from '../queues/canned-responses.queue';
import { ExportCannedResponseDto } from '../dtos/export-canned-response.dto';

@Injectable()
export class CannedResponsesProcessor {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
    ) { }

    createWorker() {
        const worker = new Worker<CannedResponsesJobData>(
            'canned-responses',
            async (job) => {
                this.logger.log(`Processing canned responses job: ${job.name}`, 'CannedResponsesProcessor');

                switch (job.name) {
                    case 'canned_responses_import':
                        await this.handleImport(job);
                        break;
                    default:
                        this.logger.warn(`Unknown job name: ${job.name}`, 'CannedResponsesProcessor');
                }
            },
            {
                connection: this.redis,
                concurrency: 4,
            }
        );

        worker.on('completed', (job) => {
            this.logger.log(`Canned responses job completed: ${job.name} - ${job.id}`, 'CannedResponsesProcessor');
        });

        worker.on('failed', (job, err) => {
            this.logger.error(`Canned responses job failed: ${job?.name} - ${job?.id} - ${err.message}`, 'CannedResponsesProcessor');
        });

        worker.on('error', (err) => {
            this.logger.error(`Canned responses worker error: ${err.message}`, 'CannedResponsesProcessor');
        });

        this.logger.log('Canned Responses Worker created and started', 'CannedResponsesProcessor');
        return worker;
    }

    private async handleImport(job: Job<CannedResponsesJobData>): Promise<void> {
        const { workspaceId, userId, items } = job.data as { workspaceId: string; userId: string; items: ExportCannedResponseDto[] };

        // Build set of titles to check existing
        const uniqueTitles: string[] = Array.from(new Set(items.map(i => i.title)));
        const existing = await this.prisma.cannedResponse.findMany({
            where: { workspaceId, title: { in: uniqueTitles } },
            select: { id: true, title: true, categoryId: true },
        });
        const titleToId = new Map(existing.map(e => [e.title, e.id]));

        for (const item of items) {
            const existingId = titleToId.get(item.title);

            // Validate category if provided
            let categoryNameForFolder: string | undefined;
            if (item.category) {
                const category = await this.prisma.cannedResponseCategory.findUnique({
                    where: { id: item.category.id, workspaceId },
                });
                if (!category) {
                    // Skip invalid category entries, log and continue
                    this.logger.warn(`Skipping item with invalid category for title '${item.title}'`, 'CannedResponsesProcessor');
                    continue;
                }
                categoryNameForFolder = category.name;
            }

            // Validate folder if provided; create if not exists
            if (item.cannedResponseFolder) {
                const folder = await this.prisma.cannedResponseFolder.findUnique({
                    where: { id: item.cannedResponseFolder.id, workspaceId },
                });
                if (!folder) {
                    await this.prisma.cannedResponseFolder.create({
                        data: {
                            workspaceId,
                            name: categoryNameForFolder ?? 'General',
                            parentId: null,
                            sortOrder: 0,
                            createdBy: userId,
                        },
                    });
                }
            }

            if (existingId) {
                await this.prisma.cannedResponse.update({
                    where: { id: existingId },
                    data: {
                        title: item.title,
                        content: item.content,
                        shortcut: item.shortcut ?? null,
                        categoryId: item.category?.id ?? null,
                        tags: item.tags ?? [],
                        isActive: item.isActive ?? true,
                        cannedResponseFolderId: item.cannedResponseFolder?.id ?? null,
                    },
                });
            } else {
                await this.prisma.cannedResponse.create({
                    data: {
                        workspaceId,
                        title: item.title,
                        content: item.content,
                        shortcut: item.shortcut ?? null,
                        categoryId: item.category?.id ?? null,
                        tags: item.tags ?? [],
                        isActive: item.isActive ?? true,
                        createdBy: userId,
                        cannedResponseFolderId: item.cannedResponseFolder?.id ?? null,
                    },
                });
            }
        }

        this.logger.log(`Canned responses import completed for workspace: ${workspaceId}; processed ${items.length} items`, 'CannedResponsesProcessor');
    }
}


