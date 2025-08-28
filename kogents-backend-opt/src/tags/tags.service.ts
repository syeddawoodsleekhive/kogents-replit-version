import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TagsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
    ) { }

    // ==========================
    // Tags CRUD
    // ==========================
    async createTag(
        workspaceId: string,
        data: { name: string; color: string; description?: string; categoryId?: string, isSystem?: boolean },
        userId?: string,
        sessionId?: string,
    ) {
        if (data.categoryId) {
            const category = await this.prisma.tagCategory.findFirst({ where: { id: data.categoryId, workspaceId } });
            if (!category) {
                throw new NotFoundException('Tag category not found');
            }
        }

        const created = await this.prisma.tag.create({
            data: {
                workspaceId,
                name: data.name,
                color: data.color,
                description: data.description ?? null,
                categoryId: data.categoryId ?? null,
                createdByUser: userId ?? undefined,
                createdByVisitor: sessionId ?? undefined,
                isSystem: data.isSystem ?? false,
            },
            include: {
                category: true,
            },
        });
        this.logger.log(`Tag created: ${created.id} in workspace: ${workspaceId}`, 'TagsService');
        return created;
    }

    async findTags(
        workspaceId: string,
        query: { search?: string; categoryId?: string; page?: number; limit?: number },
    ) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
        const skip = (page - 1) * limit;
        const search = query.search?.trim();

        const where: Prisma.TagWhereInput = { workspaceId, isSystem: false, createdByVisitor: null };
        if (query.categoryId) {
            where.categoryId = query.categoryId;
        }
        if (search && search.length > 0) {
            where.AND = [
                {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                    ],
                },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.tag.findMany({ where, orderBy: { updatedAt: 'desc' }, skip, take: limit, include: { category: true } }),
            this.prisma.tag.count({ where }),
        ]);

        const totalPages = Math.max(1, Math.ceil(total / limit));
        const response = {
            tags: items,
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };

        this.logger.log(`Found ${items.length}/${total} tags (page ${page}/${totalPages}) in workspace ${workspaceId}`, 'TagsService');
        return response;
    }

    async getTagById(tagId: string) {
        const tag = await this.prisma.tag.findUnique({ where: { id: tagId }, include: { category: true } });
        if (!tag) {
            throw new NotFoundException('Tag not found');
        }
        return tag;
    }

    async updateTag(
        workspaceId: string,
        tagId: string,
        data: { name?: string; color?: string; description?: string; categoryId?: string | null },
    ) {
        const existing = await this.prisma.tag.findFirst({ where: { id: tagId, workspaceId } });
        if (!existing) {
            throw new NotFoundException('Tag not found');
        }

        if (data.categoryId) {
            const category = await this.prisma.tagCategory.findFirst({ where: { id: data.categoryId, workspaceId } });
            if (!category) {
                throw new NotFoundException('Tag category not found');
            }
        }

        const updated = await this.prisma.tag.update({
            where: { id: tagId },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.color !== undefined && { color: data.color }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
            },
            include: {
                category: true,
            },
        });
        this.logger.log(`Tag updated: ${tagId} in workspace: ${workspaceId}`, 'TagsService');
        return updated;
    }

    async deleteTag(workspaceId: string, tagId: string) {
        const existing = await this.prisma.tag.findFirst({ where: { id: tagId, workspaceId } });
        if (!existing) {
            throw new NotFoundException('Tag not found');
        }

        // Clean up relations
        await this.prisma.conversationTag.deleteMany({ where: { tagId } });
        await this.prisma.userTagPreference.deleteMany({ where: { tagId, workspaceId } });
        await this.prisma.tagUsage.deleteMany({ where: { tagId, workspaceId } });

        const deleted = await this.prisma.tag.delete({ where: { id: tagId }, include: { category: true } });
        this.logger.log(`Tag deleted: ${tagId} in workspace: ${workspaceId}`, 'TagsService');
        return deleted;
    }

    // ==========================
    // Tag Categories CRUD
    // ==========================
    async createTagCategory(
        workspaceId: string,
        userId: string,
        data: { name: string; color: string; description?: string; sortOrder?: number },
    ) {
        const created = await this.prisma.tagCategory.create({
            data: {
                workspaceId,
                name: data.name,
                color: data.color,
                description: data.description ?? null,
                sortOrder: data.sortOrder ?? 0,
                createdBy: userId,
            },
        });
        this.logger.log(`Tag category created: ${created.id} in workspace: ${workspaceId}`, 'TagsService');
        return created;
    }

    async getTagCategories(workspaceId: string) {
        const items = await this.prisma.tagCategory.findMany({ where: { workspaceId }, orderBy: { sortOrder: 'asc' } });
        return items;
    }

    async updateTagCategory(
        workspaceId: string,
        categoryId: string,
        data: { name?: string; color?: string; description?: string; sortOrder?: number },
    ) {
        const existing = await this.prisma.tagCategory.findFirst({ where: { id: categoryId, workspaceId } });
        if (!existing) {
            throw new NotFoundException('Tag category not found');
        }

        const updated = await this.prisma.tagCategory.update({
            where: { id: categoryId },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.color !== undefined && { color: data.color }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
            },
        });
        this.logger.log(`Tag category updated: ${categoryId} in workspace: ${workspaceId}`, 'TagsService');
        return updated;
    }

    async deleteTagCategory(workspaceId: string, categoryId: string) {
        const existing = await this.prisma.tagCategory.findFirst({ where: { id: categoryId, workspaceId } });
        if (!existing) {
            throw new NotFoundException('Tag category not found');
        }

        // Detach tags from this category
        await this.prisma.tag.updateMany({ where: { workspaceId, categoryId }, data: { categoryId: null } });

        await this.prisma.tagCategory.delete({ where: { id: categoryId } });
        this.logger.log(`Tag category deleted: ${categoryId} in workspace: ${workspaceId}`, 'TagsService');
        return { success: true };
    }

    // ==========================
    // Favorites & Most Used
    // ==========================
    async markFavoriteTag(workspaceId: string, userId: string, tagId: string) {
        const tag = await this.prisma.tag.findFirst({ where: { id: tagId, workspaceId } });
        if (!tag) {
            throw new NotFoundException('Tag not found');
        }

        const existing = await this.prisma.userTagPreference.findFirst({ where: { userId, workspaceId, tagId } });
        let pref;
        if (existing) {
            pref = await this.prisma.userTagPreference.update({ where: { id: existing.id }, data: { isFavorite: true } });
        } else {
            pref = await this.prisma.userTagPreference.create({ data: { userId, workspaceId, tagId, isFavorite: true } });
        }

        this.logger.log(`Marked tag favorite: tag ${tagId} for user ${userId} in workspace ${workspaceId}`, 'TagsService');
        return pref;
    }

    async unmarkFavoriteTag(workspaceId: string, userId: string, tagId: string) {
        const existing = await this.prisma.userTagPreference.findFirst({ where: { userId, workspaceId, tagId } });
        if (!existing) {
            throw new NotFoundException('Favorite tag not found');
        }
        await this.prisma.userTagPreference.update({ where: { id: existing.id }, data: { isFavorite: false } });
        this.logger.log(`Unmarked tag favorite: tag ${tagId} for user ${userId} in workspace ${workspaceId}`, 'TagsService');
        return { success: true };
    }

    async getFavoriteTags(workspaceId: string, userId: string) {
        const prefs = await this.prisma.userTagPreference.findMany({ where: { userId, workspaceId, isFavorite: true }, select: { tagId: true } });
        const ids = prefs.map(p => p.tagId);
        if (ids.length === 0) return [];
        const items = await this.prisma.tag.findMany({ where: { id: { in: ids }, workspaceId }, include: { category: true } });
        return items;
    }

    async getMostUsedTags(workspaceId: string, userId: string, limit = 10) {
        const usage = await this.prisma.userTagPreference.findMany({
            where: { userId, workspaceId },
            orderBy: { usageCount: 'desc' },
            take: limit,
        });
        const ids = usage.map(u => u.tagId);
        if (ids.length === 0) return [];
        const tags = await this.prisma.tag.findMany({ where: { id: { in: ids }, workspaceId }, include: { category: true } });
        const map = new Map(tags.map(t => [t.id, t]));
        return usage.map(u => ({ tag: map.get(u.tagId), usageCount: u.usageCount }));
    }

    // ==========================
    // Category Tags & Usage
    // ==========================
    async getCategoryTags(workspaceId: string, categoryId: string) {
        const existing = await this.prisma.tagCategory.findFirst({ where: { id: categoryId, workspaceId } });
        if (!existing) {
            throw new NotFoundException('Tag category not found');
        }
        return this.prisma.tag.findMany({ where: { workspaceId, categoryId }, include: { category: true } });
    }

    async getCategoryUsage(workspaceId: string, categoryId: string) {
        const existing = await this.prisma.tagCategory.findFirst({ where: { id: categoryId, workspaceId } });
        if (!existing) {
            throw new NotFoundException('Tag category not found');
        }
        const tags = await this.prisma.tag.findMany({ where: { workspaceId, categoryId }, select: { id: true, name: true } });
        const ids = tags.map(t => t.id);
        if (ids.length === 0) return { categoryId, totalUsage: 0, items: [] };
        const usage = await this.prisma.tagUsage.findMany({ where: { workspaceId, tagId: { in: ids } }, select: { tagId: true, usageCount: true } });
        const usageMap = new Map<string, number>();
        for (const u of usage) usageMap.set(u.tagId, (usageMap.get(u.tagId) ?? 0) + (u.usageCount || 0));
        const items = tags.map(t => ({ tagId: t.id, name: t.name, usageCount: usageMap.get(t.id) ?? 0 }));
        const totalUsage = items.reduce((sum, i) => sum + i.usageCount, 0);
        return { categoryId, totalUsage, items };
    }

    // ==========================
    // Chat Assignments
    // ==========================

    async assignTagToChat(roomId: string, tagId: string, userId?: string, sessionId?: string) {
        const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });

        if (!tag) {
            throw new NotFoundException('Tag not found');
        }

        let preAssigned;
        if (userId) {
            preAssigned = await this.prisma.conversationTag.findFirst({ where: { conversationId: roomId, tagId, assignedByUser: userId } });
        } else {
            preAssigned = await this.prisma.conversationTag.findFirst({ where: { conversationId: roomId, tagId, assignedByVisitor: sessionId } });
        }

        if (preAssigned) {
            const chatAssignment = await this.prisma.conversationTag.update({ where: { id: preAssigned.id }, data: { assignedAt: new Date(), removedByUser: null, removedAt: null, removedByVisitor: null } });

            this.logger.log(`Tag reassigned to chat: ${roomId} in workspace: ${tag.workspaceId} by user or visitor: ${userId ?? sessionId}`, 'TagsService');
            return chatAssignment;
        }

        const chatAssignment = await this.prisma.conversationTag.create({
            data: {
                conversationId: roomId,
                tagId,
                assignedByUser: userId ?? undefined,
                assignedByVisitor: sessionId ?? undefined,
            },
        });

        this.logger.log(`Tag assigned to chat: ${roomId} in workspace: ${tag.workspaceId}`, 'TagsService');
        return chatAssignment;
    }

    async unassignTagFromChat(roomId: string, tagId: string, userId: string) {
        const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });

        if (!tag) {
            throw new NotFoundException('Tag not found');
        }

        const isAssignedByUser = await this.prisma.conversationTag.findFirst({ where: { conversationId: roomId, tagId, assignedByUser: userId } });

        if (!isAssignedByUser) {
            throw new NotFoundException('Tag not assigned to chat by requesting user');
        }

        const chatAssignment = await this.prisma.conversationTag.update({ where: { id: isAssignedByUser.id }, data: { removedByUser: userId, removedAt: new Date() } });

        this.logger.log(`Tag unassigned from chat: ${roomId} in workspace: ${tag.workspaceId}`, 'TagsService');
        return chatAssignment;
    }

    async visitorUnassignTagFromChat(roomId: string, tagName: string, sessionId: string) {
        const tag = await this.prisma.tag.findUnique({ where: { name_createdByVisitor: { name: tagName, createdByVisitor: sessionId } } });

        if (!tag) {
            throw new NotFoundException('Tag not found');
        }

        const isAssigned = await this.prisma.conversationTag.findFirst({ where: { conversationId: roomId, tagId: tag.id } });

        if (!isAssigned) {
            throw new NotFoundException('Tag not assigned to chat');
        }

        const chatAssignment = await this.prisma.conversationTag.update({ where: { id: isAssigned.id }, data: { removedByVisitor: sessionId, removedAt: new Date() }, include: { tag: true } });

        this.logger.log(`Tag unassigned from chat: ${roomId} in workspace: ${tag.workspaceId} by visitor: ${sessionId}`, 'TagsService');
        return chatAssignment;
    }
}