import { Injectable, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { CreateCannedResponseDto } from './dtos/create-canned-response.dto';
import { CannedResponseResponseDto } from './dtos/canned-response-response.dto';
import { FindCannedResponsesDto } from './dtos/find-canned-responses.dto';
import { Prisma } from '@prisma/client';
import { FindCannedResponsesResponseDto } from './dtos/find-canned-responses-response.dto';
import { UpdateCannedResponseDto } from './dtos/update-canned-response.dto';
import { ExportCannedResponseDto } from './dtos/export-canned-response.dto';
import { ImportCannedResponsesDto } from './dtos/import-canned-responses.dto';
import { Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CannedResponseUserPreferenceResponseDto } from './dtos/canned-response-user-preference-response.dto';
import { CreateCannedResponseCategoryDto } from './dtos/create-canned-response-category.dto';
import { UpdateCannedResponseCategoryDto } from './dtos/update-canned-response-category.dto';
import { CannedResponseCategoryResponseDto } from './dtos/canned-response-category-response.dto';
import { CategoryUsageResponseDto } from './dtos/category-usage-response.dto';
import { CreateCannedResponseFolderDto } from './dtos/create-canned-response-folder.dto';
import { UpdateCannedResponseFolderDto } from './dtos/update-canned-response-folder.dto';
import { CannedResponseFolderResponseDto } from './dtos/canned-response-folder-response.dto';

@Injectable()
export class CannedResponsesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        @Inject('CANNED_RESPONSES_QUEUE') private readonly cannedResponsesQueue: Queue,
    ) { }

    async createCannedResponse(
        workspaceId: string,
        userId: string,
        dto: CreateCannedResponseDto,
    ): Promise<CannedResponseResponseDto> {
        try {

            const cannedResponseCategory = await this.prisma.cannedResponseCategory.findUnique({
                where: {
                    id: dto.categoryId,
                    workspaceId
                }
            });

            if (!cannedResponseCategory) {
                throw new NotFoundException('Category not found. Please create a category first.');
            }

            if (dto.cannedResponseFolderId) {
                const cannedResponseFolder = await this.prisma.cannedResponseFolder.findUnique({
                    where: {
                        id: dto.cannedResponseFolderId,
                        workspaceId
                    }
                });

                if (!cannedResponseFolder) {
                    await this.prisma.cannedResponseFolder.create({
                        data: {
                            workspaceId,
                            name: cannedResponseCategory.name,
                            parentId: null,
                            sortOrder: 0,
                            createdBy: userId,
                        }
                    });
                }
            }

            const created = await this.prisma.cannedResponse.create({
                data: {
                    workspaceId,
                    title: dto.title,
                    content: dto.content,
                    shortcut: dto.shortcut ?? null,
                    categoryId: dto.categoryId ?? null,
                    tags: dto.tags ?? [],
                    isActive: dto.isActive ?? true,
                    createdBy: userId,
                    cannedResponseFolderId: dto.cannedResponseFolderId ?? null,
                },
                include: {
                    category: true,
                    cannedResponseFolder: true,
                },
            });
            this.logger.log(`Canned response created: ${created.id} in workspace: ${workspaceId}`, 'CannedResponsesService');
            return created as unknown as CannedResponseResponseDto;
        } catch (e: any) {
            this.logger.error(`Create canned response failed: ${e?.message}`, 'CannedResponsesService');
            // Optionally map Prisma unique violations, etc.
            throw new ConflictException('Failed to create canned response');
        }
    }

    async findCannedResponses(
        workspaceId: string,
        query: FindCannedResponsesDto,
    ): Promise<FindCannedResponsesResponseDto> {

        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
        const skip = (page - 1) * limit;

        const search = query.search?.trim();

        const where: Prisma.CannedResponseWhereInput = {
            workspaceId,
        };

        if (query.category) {
            where.category = {
                name: {
                    equals: query.category,
                },
            };
        }

        if (search && search.length > 0) {
            where.AND = [
                {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { content: { contains: search, mode: 'insensitive' } },
                        { tags: { has: search } },
                        { shortcut: { contains: search, mode: 'insensitive' } },
                        { cannedResponseFolder: { name: { contains: search, mode: 'insensitive' } } },
                    ],
                },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.cannedResponse.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
                include: {
                    category: true,
                    cannedResponseFolder: true,
                },
            }),
            this.prisma.cannedResponse.count({ where }),
        ]);

        const totalPages = Math.max(1, Math.ceil(total / limit));
        const response: FindCannedResponsesResponseDto = {
            cannedResponses: items as unknown as any[],
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };

        this.logger.log(
            `Found ${items.length}/${total} canned responses (page ${page}/${totalPages}) in workspace ${workspaceId}`,
            'CannedResponsesService',
        );

        return response;
    }

    async updateCannedResponse(
        workspaceId: string,
        id: string,
        userId: string,
        dto: UpdateCannedResponseDto,
    ): Promise<CannedResponseResponseDto> {

        // Ensure the canned response exists within the workspace
        const existing = await this.prisma.cannedResponse.findUnique({
            where: { id, workspaceId },
        });

        if (!existing) {
            throw new NotFoundException('Canned response not found');
        }

        // Validate category if provided
        let categoryNameForFolder: string | undefined;
        if (dto.categoryId) {
            const category = await this.prisma.cannedResponseCategory.findUnique({
                where: { id: dto.categoryId, workspaceId },
            });
            if (!category) {
                throw new NotFoundException('Category not found. Please create a category first.');
            }
            categoryNameForFolder = category.name;
        } else if (existing.categoryId) {
            const category = await this.prisma.cannedResponseCategory.findUnique({
                where: { id: existing.categoryId, workspaceId },
            });
            categoryNameForFolder = category?.name;
        }

        // Validate (or create) folder if provided
        if (dto.cannedResponseFolderId) {
            const folder = await this.prisma.cannedResponseFolder.findUnique({
                where: { id: dto.cannedResponseFolderId, workspaceId },
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

        const updated = await this.prisma.cannedResponse.update({
            where: { id },
            data: {
                title: dto.title,
                content: dto.content,
                shortcut: dto.shortcut,
                categoryId: dto.categoryId,
                tags: dto.tags,
                isActive: dto.isActive,
                cannedResponseFolderId: dto.cannedResponseFolderId,
            },
            include: {
                category: true,
                cannedResponseFolder: true,
            },
        });

        this.logger.log(`Canned response updated: ${updated.id} in workspace: ${workspaceId}`, 'CannedResponsesService');

        return updated as unknown as CannedResponseResponseDto;
    }

    async deleteCannedResponse(
        workspaceId: string,
        id: string,
    ): Promise<CannedResponseResponseDto> {

        const existing = await this.prisma.cannedResponse.findUnique({
            where: { id, workspaceId },
        });

        if (!existing) {
            throw new NotFoundException('Canned response not found');
        }

        const deleted = await this.prisma.cannedResponse.delete({
            where: { id },
            include: {
                category: true,
                cannedResponseFolder: true,
            },
        });

        this.logger.log(`Canned response deleted: ${id} in workspace: ${workspaceId}`, 'CannedResponsesService');

        return deleted as unknown as CannedResponseResponseDto;
    }

    async exportCannedResponses(
        workspaceId: string,
    ): Promise<ExportCannedResponseDto[]> {
        const items = await this.prisma.cannedResponse.findMany({
            where: { workspaceId },
            orderBy: { updatedAt: 'desc' },
            include: {
                category: true,
                cannedResponseFolder: true,
            },
        });

        const exported: ExportCannedResponseDto[] = items.map((item) => ({
            title: item.title,
            content: item.content,
            shortcut: item.shortcut ?? undefined,
            category: item.category ?? undefined,
            tags: item.tags ?? [],
            isActive: item.isActive ?? true,
            cannedResponseFolder: item.cannedResponseFolder ?? undefined,
        }));

        this.logger.log(`Exported ${exported.length} canned responses from workspace: ${workspaceId}`, 'CannedResponsesService');

        return exported;
    }

    async importCannedResponses(
        workspaceId: string,
        userId: string,
        payload: ImportCannedResponsesDto,
    ): Promise<{ success: boolean; message: string; jobId: string }> {
        if (!payload.items || payload.items.length === 0) {
            return { success: true, message: 'No items to import', jobId: '' };
        }

        const job = await this.cannedResponsesQueue.add(
            'canned_responses_import',
            {
                type: 'canned_responses_import',
                workspaceId,
                userId,
                items: payload.items,
            },
            {
                priority: 7,
            }
        );

        this.logger.log(`Queued canned responses import job: ${job.id} for workspace: ${workspaceId}`, 'CannedResponsesService');

        return {
            success: true,
            message: 'Canned responses import initiated',
            jobId: job.id as string,
        };
    }

    // ==========================
    // User Favorites Management
    // ==========================
    async markFavorite(
        workspaceId: string,
        userId: string,
        responseId: string,
    ): Promise<CannedResponseUserPreferenceResponseDto> {
        // Ensure response exists in workspace
        const response = await this.prisma.cannedResponse.findFirst({ where: { id: responseId, workspaceId } });
        if (!response) {
            throw new NotFoundException('Canned response not found');
        }

        const existing = await this.prisma.cannedResponseUserPreference.findFirst({
            where: { userId, workspaceId, cannedResponseId: responseId },
        });

        let pref;
        if (existing) {
            pref = await this.prisma.cannedResponseUserPreference.update({
                where: { id: existing.id },
                data: { isFavorite: true },
            });
        } else {
            pref = await this.prisma.cannedResponseUserPreference.create({
                data: { userId, workspaceId, cannedResponseId: responseId, isFavorite: true },
            });
        }

        this.logger.log(`Marked favorite: response ${responseId} for user ${userId} in workspace ${workspaceId}`, 'CannedResponsesService');
        return pref as unknown as CannedResponseUserPreferenceResponseDto;
    }

    async unmarkFavorite(
        workspaceId: string,
        userId: string,
        responseId: string,
    ): Promise<{ success: boolean }> {
        const existing = await this.prisma.cannedResponseUserPreference.findFirst({
            where: { userId, workspaceId, cannedResponseId: responseId },
        });
        if (!existing) {
            throw new NotFoundException('Favorite not found');
        }

        await this.prisma.cannedResponseUserPreference.update({
            where: { id: existing.id },
            data: { isFavorite: false },
        });

        this.logger.log(`Unmarked favorite: response ${responseId} for user ${userId} in workspace ${workspaceId}`, 'CannedResponsesService');
        return { success: true };
    }

    async getFavorites(
        workspaceId: string,
        userId: string,
    ): Promise<CannedResponseResponseDto[]> {
        const prefs = await this.prisma.cannedResponseUserPreference.findMany({
            where: { userId, workspaceId, isFavorite: true },
            select: { cannedResponseId: true },
        });
        const ids = prefs.map(p => p.cannedResponseId);
        if (ids.length === 0) return [] as any;

        const items = await this.prisma.cannedResponse.findMany({ where: { id: { in: ids }, workspaceId }, include: { category: true, cannedResponseFolder: true } });
        return items as unknown as CannedResponseResponseDto[];
    }

    async getMostUsed(
        workspaceId: string,
        userId: string,
        limit = 10,
    ): Promise<Array<{ cannedResponse: CannedResponseResponseDto; usageCount: number }>> {
        const usage = await this.prisma.cannedResponseUserPreference.findMany({
            where: { userId, workspaceId },
            orderBy: { usageCount: 'desc' },
            take: limit,
        });

        const ids = usage.map(u => u.cannedResponseId);
        if (ids.length === 0) return [] as any;

        const responses = await this.prisma.cannedResponse.findMany({ where: { id: { in: ids }, workspaceId }, include: { category: true, cannedResponseFolder: true } });
        const map = new Map(responses.map(r => [r.id, r]));
        return usage.map(u => ({ cannedResponse: map.get(u.cannedResponseId) as any, usageCount: u.usageCount }));
    }

    // ==========================
    // Categories Management
    // ==========================
    async createCategory(
        workspaceId: string,
        userId: string,
        dto: CreateCannedResponseCategoryDto,
    ): Promise<CannedResponseCategoryResponseDto> {
        const created = await this.prisma.cannedResponseCategory.create({
            data: {
                workspaceId,
                name: dto.name,
                color: dto.color,
                description: dto.description ?? null,
                sortOrder: dto.sortOrder ?? 0,
            },
        });
        this.logger.log(`Category created: ${created.id} in workspace: ${workspaceId}`, 'CannedResponsesService');
        return created as unknown as CannedResponseCategoryResponseDto;
    }

    async getCategories(workspaceId: string): Promise<CannedResponseCategoryResponseDto[]> {
        const items = await this.prisma.cannedResponseCategory.findMany({
            where: { workspaceId },
            orderBy: { sortOrder: 'asc' },
        });
        return items as unknown as CannedResponseCategoryResponseDto[];
    }

    async updateCategory(
        workspaceId: string,
        categoryId: string,
        dto: UpdateCannedResponseCategoryDto,
    ): Promise<CannedResponseCategoryResponseDto> {
        const existing = await this.prisma.cannedResponseCategory.findFirst({ where: { id: categoryId, workspaceId } });
        if (!existing) {
            throw new NotFoundException('Category not found');
        }

        const updated = await this.prisma.cannedResponseCategory.update({
            where: { id: categoryId },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.color !== undefined && { color: dto.color }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
            },
        });
        this.logger.log(`Category updated: ${categoryId} in workspace: ${workspaceId}`, 'CannedResponsesService');
        return updated as unknown as CannedResponseCategoryResponseDto;
    }

    async deleteCategory(workspaceId: string, categoryId: string): Promise<{ success: boolean }> {
        const existing = await this.prisma.cannedResponseCategory.findFirst({ where: { id: categoryId, workspaceId } });
        if (!existing) {
            throw new NotFoundException('Category not found');
        }

        // Optional: set categoryId to null for associated responses to avoid FK issues
        await this.prisma.cannedResponse.updateMany({
            where: { workspaceId, categoryId },
            data: { categoryId: null },
        });

        await this.prisma.cannedResponseCategory.delete({ where: { id: categoryId } });
        this.logger.log(`Category deleted: ${categoryId} in workspace: ${workspaceId}`, 'CannedResponsesService');
        return { success: true };
    }

    async getCategoryResponses(
        workspaceId: string,
        categoryId: string,
    ): Promise<CannedResponseResponseDto[]> {
        const existing = await this.prisma.cannedResponseCategory.findFirst({ where: { id: categoryId, workspaceId } });
        if (!existing) {
            throw new NotFoundException('Category not found');
        }
        const items = await this.prisma.cannedResponse.findMany({ where: { workspaceId, categoryId }, include: { category: true, cannedResponseFolder: true } });
        return items as unknown as CannedResponseResponseDto[];
    }

    async getCategoryUsage(
        workspaceId: string,
        categoryId: string,
    ): Promise<CategoryUsageResponseDto> {
        const existing = await this.prisma.cannedResponseCategory.findFirst({ where: { id: categoryId, workspaceId } });
        if (!existing) {
            throw new NotFoundException('Category not found');
        }

        const responses = await this.prisma.cannedResponse.findMany({
            where: { workspaceId, categoryId },
            select: { id: true, title: true },
        });
        const ids = responses.map(r => r.id);
        if (ids.length === 0) {
            return { categoryId, totalUsage: 0, items: [] };
        }

        const prefs = await this.prisma.cannedResponseUserPreference.findMany({
            where: { cannedResponseId: { in: ids }, workspaceId },
            select: { cannedResponseId: true, usageCount: true },
        });
        const usageMap = new Map<string, number>();
        for (const p of prefs) {
            usageMap.set(p.cannedResponseId, (usageMap.get(p.cannedResponseId) ?? 0) + (p.usageCount || 0));
        }

        const items = responses.map(r => ({
            cannedResponseId: r.id,
            title: r.title,
            usageCount: usageMap.get(r.id) ?? 0,
        }));
        const totalUsage = items.reduce((sum, i) => sum + i.usageCount, 0);

        return { categoryId, totalUsage, items };
    }

    // ==========================
    // Folders Management
    // ==========================
    async createFolder(
        workspaceId: string,
        userId: string,
        dto: CreateCannedResponseFolderDto,
    ): Promise<CannedResponseFolderResponseDto> {
        // Validate parent if provided
        if (dto.parentId) {
            const parent = await this.prisma.cannedResponseFolder.findFirst({ where: { id: dto.parentId, workspaceId } });
            if (!parent) {
                throw new NotFoundException('Parent folder not found');
            }
        }

        const created = await this.prisma.cannedResponseFolder.create({
            data: {
                workspaceId,
                name: dto.name,
                parentId: dto.parentId ?? null,
                sortOrder: dto.sortOrder ?? 0,
                createdBy: userId,
            },
        });
        this.logger.log(`Folder created: ${created.id} in workspace: ${workspaceId}`, 'CannedResponsesService');
        return created as unknown as CannedResponseFolderResponseDto;
    }

    async getFolders(workspaceId: string): Promise<CannedResponseFolderResponseDto[]> {
        const items = await this.prisma.cannedResponseFolder.findMany({ where: { workspaceId }, orderBy: { sortOrder: 'asc' } });
        return items as unknown as CannedResponseFolderResponseDto[];
    }

    async updateFolder(
        workspaceId: string,
        folderId: string,
        dto: UpdateCannedResponseFolderDto,
    ): Promise<CannedResponseFolderResponseDto> {
        const existing = await this.prisma.cannedResponseFolder.findFirst({ where: { id: folderId, workspaceId } });
        if (!existing) {
            throw new NotFoundException('Folder not found');
        }

        if (dto.parentId) {
            const parent = await this.prisma.cannedResponseFolder.findFirst({ where: { id: dto.parentId, workspaceId } });
            if (!parent) {
                throw new NotFoundException('Parent folder not found');
            }
        }

        const updated = await this.prisma.cannedResponseFolder.update({
            where: { id: folderId },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.parentId !== undefined && { parentId: dto.parentId }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
            },
        });
        this.logger.log(`Folder updated: ${folderId} in workspace: ${workspaceId}`, 'CannedResponsesService');
        return updated as unknown as CannedResponseFolderResponseDto;
    }

    async deleteFolder(workspaceId: string, folderId: string): Promise<{ success: boolean }> {
        const existing = await this.prisma.cannedResponseFolder.findFirst({ where: { id: folderId, workspaceId } });
        if (!existing) {
            throw new NotFoundException('Folder not found');
        }

        // Re-parent children to this folder's parent (or null)
        await this.prisma.cannedResponseFolder.updateMany({ where: { workspaceId, parentId: folderId }, data: { parentId: existing.parentId ?? null } });

        await this.prisma.cannedResponseFolder.delete({ where: { id: folderId } });
        this.logger.log(`Folder deleted: ${folderId} in workspace: ${workspaceId}`, 'CannedResponsesService');
        return { success: true };
    }

    // ==========================
    // Canned Response Usage
    // ==========================

    async setCannedResponseUsage(
        roomId: string,
        userId: string,
        responseId: string,
        workspaceId: string,
    ): Promise<any> {

        try {
            const existing = await this.prisma.cannedResponseUsage.findFirst({
                where: {
                    cannedResponseId: responseId,
                    userId: userId,
                    roomId: roomId,
                },
            });

            const isFavorite = await this.prisma.cannedResponseUserPreference.findFirst({
                where: {
                    cannedResponseId: responseId,
                    userId: userId,
                    workspaceId: workspaceId,
                },
            });

            let usage: any;

            if (existing) {
                usage = await this.prisma.cannedResponseUsage.update({
                    where: { id: existing.id },
                    data: { usageCount: existing.usageCount + 1 },
                    select: {
                        usageCount: true,
                        usedAt: true,
                    },
                });
            } else {
                usage = await this.prisma.cannedResponseUsage.create({
                    data: {
                        cannedResponseId: responseId,
                        userId: userId,
                        roomId: roomId,
                        usageCount: 1,
                    },
                    select: {
                        usageCount: true,
                        usedAt: true,
                    },
                });
            }

            if (isFavorite) {
                await this.prisma.cannedResponseUserPreference.update({
                    where: { id: isFavorite.id },
                    data: { usageCount: isFavorite.usageCount + 1 },
                });
            } else {
                await this.prisma.cannedResponseUserPreference.create({
                    data: {
                        cannedResponseId: responseId,
                        userId: userId,
                        workspaceId: workspaceId,
                        usageCount: 1,
                    },
                });
            }

            this.logger.log(`Canned response used: ${responseId} in workspace: ${workspaceId}`, 'CannedResponsesService');

            return usage;
        } catch (error) {
            this.logger.error(`Error setting canned response usage: ${error}`, 'CannedResponsesService');
            throw new InternalServerErrorException('Error setting canned response usage');
        }
    }
}