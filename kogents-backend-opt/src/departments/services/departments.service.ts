import { Injectable, ConflictException, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from '../dtos/create-department.dto';
import { UpdateDepartmentDto } from '../dtos/update-department.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { Redis } from 'ioredis';

// Redis TTL constants (in seconds)
const REDIS_TTL_DEPARTMENT = 30 * 60; // 30 minutes
const REDIS_TTL_DEPARTMENT_LIST = 30 * 60; // 30 minutes
const REDIS_TTL_ACTIVE_DEPARTMENT_LIST = 30 * 60; // 30 minutes
const REDIS_TTL_AVAILABLE_DEPARTMENT_LIST = 5 * 60; // 5 minutes
const REDIS_TTL_DEPARTMENT_AGENT_STATUSES = 5 * 60; // 5 minutes

// Redis key helpers
const REDIS_KEY_DEPARTMENT = (departmentId: string) => `department:${departmentId}`;
const REDIS_KEY_DEPARTMENTS_BY_WORKSPACE = (workspaceId: string) => `departments:workspace:${workspaceId}`;
const REDIS_KEY_ACTIVE_DEPARTMENTS_BY_WORKSPACE = (workspaceId: string) => `departments:active:workspace:${workspaceId}`;
const REDIS_KEY_AVAILABLE_DEPARTMENTS_BY_WORKSPACE = (workspaceId: string) => `departments:available:workspace:${workspaceId}`;
const REDIS_KEY_DEPARTMENT_AGENTS = (departmentId: string) => `department_agents:${departmentId}`;

@Injectable()
export class DepartmentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
    ) { }

    async createDepartment(createDepartmentDto: CreateDepartmentDto, workspaceId: string) {

        this.logger.log(`Creating department in workspace ${workspaceId}: ${createDepartmentDto.name}`, 'DepartmentsService');

        // Check if department with same name already exists in the workspace
        const existingDepartment = await this.prisma.department.findFirst({
            where: {
                name: createDepartmentDto.name,
                workspaceId: workspaceId,
            },
        });

        if (existingDepartment) {
            this.logger.warn(`Department creation failed - name already exists in workspace: ${createDepartmentDto.name}`, 'DepartmentsService');
            throw new ConflictException('Department with this name already exists in the workspace');
        }

        // Create department
        const department = await this.prisma.department.create({
            data: {
                name: createDepartmentDto.name,
                description: createDepartmentDto.description,
                color: createDepartmentDto.color,
                icon: createDepartmentDto.icon,
                isActive: createDepartmentDto.isActive ?? false,
                workspaceId: workspaceId,
            },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                icon: true,
                isActive: true,
                workspaceId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // Cache the created department with shorter TTL
        const cacheKey = REDIS_KEY_DEPARTMENT(department.id);
        await this.redis.setex(cacheKey, REDIS_TTL_DEPARTMENT, JSON.stringify(department));
        await this.redis.del(REDIS_KEY_DEPARTMENTS_BY_WORKSPACE(workspaceId));
        await this.redis.del(REDIS_KEY_ACTIVE_DEPARTMENTS_BY_WORKSPACE(workspaceId));
        await this.redis.del(REDIS_KEY_AVAILABLE_DEPARTMENTS_BY_WORKSPACE(workspaceId));

        this.logger.log(`Department created successfully: ${department.id}`, 'DepartmentsService');
        return department;
    }

    async getDepartmentsByWorkspace(workspaceId: string) {

        // Try to get from cache first
        const cacheKey = REDIS_KEY_DEPARTMENTS_BY_WORKSPACE(workspaceId);
        const cachedData = await this.redis.get(cacheKey);

        if (cachedData) {
            this.logger.log(`Departments retrieved from cache for workspace: ${workspaceId}`, 'DepartmentsService');
            return JSON.parse(cachedData);
        }

        // Fetch from database
        const departments = await this.prisma.department.findMany({
            where: {
                workspaceId: workspaceId,
            },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                icon: true,
                isActive: true,
                workspaceId: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Cache the result
        await this.redis.setex(cacheKey, REDIS_TTL_DEPARTMENT_LIST, JSON.stringify(departments));

        this.logger.log(`Departments retrieved from database for workspace: ${workspaceId}`, 'DepartmentsService');
        return departments;
    }

    async getActiveDepartmentsByWorkspace(workspaceId: string) {

        // Try to get from cache first
        const cacheKey = REDIS_KEY_ACTIVE_DEPARTMENTS_BY_WORKSPACE(workspaceId);
        const cachedData = await this.redis.get(cacheKey);

        if (cachedData) {
            this.logger.log(`Active departments retrieved from cache for workspace: ${workspaceId}`, 'DepartmentsService');
            return JSON.parse(cachedData);
        }

        // Fetch from database
        const departments = await this.prisma.department.findMany({
            where: {
                workspaceId: workspaceId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                icon: true,
                isActive: true,
                workspaceId: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Cache the result
        await this.redis.setex(cacheKey, REDIS_TTL_ACTIVE_DEPARTMENT_LIST, JSON.stringify(departments));

        this.logger.log(`Active departments retrieved from database for workspace: ${workspaceId}`, 'DepartmentsService');
        return departments;
    }

    async updateDepartment(departmentId: string, updateDepartmentDto: UpdateDepartmentDto, workspaceId: string) {

        this.logger.log(`Updating department ${departmentId} in workspace ${workspaceId}`, 'DepartmentsService');

        // Check if department exists and belongs to the workspace
        const existingDepartment = await this.prisma.department.findFirst({
            where: {
                id: departmentId,
                workspaceId: workspaceId,
            },
        });

        if (!existingDepartment) {
            this.logger.warn(`Department not found: ${departmentId} in workspace ${workspaceId}`, 'DepartmentsService');
            throw new NotFoundException(`Department with ID '${departmentId}' not found`);
        }

        // Check if name is being updated and if it conflicts with another department
        if (updateDepartmentDto.name && updateDepartmentDto.name !== existingDepartment.name) {
            const conflictingDepartment = await this.prisma.department.findFirst({
                where: {
                    name: updateDepartmentDto.name,
                    workspaceId: workspaceId,
                    id: { not: departmentId }, // Exclude current department
                },
            });

            if (conflictingDepartment) {
                this.logger.warn(`Department update failed - name already exists in workspace: ${updateDepartmentDto.name}`, 'DepartmentsService');
                throw new ConflictException('Department with this name already exists in the workspace');
            }
        }

        // Update department
        const updatedDepartment = await this.prisma.department.update({
            where: {
                id: departmentId,
            },
            data: {
                name: updateDepartmentDto.name,
                description: updateDepartmentDto.description,
                color: updateDepartmentDto.color,
                icon: updateDepartmentDto.icon,
                isActive: updateDepartmentDto.isActive,
            },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                icon: true,
                isActive: true,
                workspaceId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // Update cache
        const cacheKey = REDIS_KEY_DEPARTMENT(departmentId);
        await this.redis.setex(cacheKey, REDIS_TTL_DEPARTMENT, JSON.stringify(updatedDepartment));

        // Invalidate workspace departments list cache
        await this.redis.del(REDIS_KEY_DEPARTMENTS_BY_WORKSPACE(workspaceId));
        await this.redis.del(REDIS_KEY_ACTIVE_DEPARTMENTS_BY_WORKSPACE(workspaceId));
        await this.redis.del(REDIS_KEY_AVAILABLE_DEPARTMENTS_BY_WORKSPACE(workspaceId));

        this.logger.log(`Department updated successfully: ${departmentId}`, 'DepartmentsService');
        return updatedDepartment;
    }

    async getDepartmentById(departmentId: string, workspaceId: string) {

        if (!workspaceId) {
            throw new ForbiddenException('User must be associated with a workspace');
        }

        this.logger.log(`Getting department ${departmentId} in workspace ${workspaceId}`, 'DepartmentsService');

        // Try to get from cache first
        const cacheKey = REDIS_KEY_DEPARTMENT(departmentId);
        const cachedData = await this.redis.get(cacheKey);

        if (cachedData) {
            this.logger.log(`Department retrieved from cache: ${departmentId}`, 'DepartmentsService');
            return JSON.parse(cachedData);
        }

        // Fetch from database
        const department = await this.prisma.department.findFirst({
            where: {
                id: departmentId,
                workspaceId: workspaceId,
            },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                icon: true,
                isActive: true,
                workspaceId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!department) {
            this.logger.warn(`Department not found: ${departmentId} in workspace ${workspaceId}`, 'DepartmentsService');
            throw new NotFoundException(`Department with ID '${departmentId}' not found`);
        }

        // Cache the result
        await this.redis.setex(cacheKey, REDIS_TTL_DEPARTMENT, JSON.stringify(department));

        this.logger.log(`Department retrieved from database: ${departmentId}`, 'DepartmentsService');
        return department;
    }

    async deleteDepartment(departmentId: string, workspaceId: string) {

        this.logger.log(`Deleting department ${departmentId} in workspace ${workspaceId}`, 'DepartmentsService');

        // Check if department exists and belongs to the workspace
        const existingDepartment = await this.prisma.department.findFirst({
            where: {
                id: departmentId,
                workspaceId: workspaceId,
            },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                icon: true,
                isActive: true,
                workspaceId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!existingDepartment) {
            this.logger.warn(`Department not found for deletion: ${departmentId} in workspace ${workspaceId}`, 'DepartmentsService');
            throw new NotFoundException(`Department with ID '${departmentId}' not found`);
        }

        // Delete department
        const deletedDepartment = await this.prisma.department.delete({
            where: {
                id: departmentId,
            },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                icon: true,
                isActive: true,
                workspaceId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // Clear cache
        const cacheKey = REDIS_KEY_DEPARTMENT(departmentId);
        await this.redis.del(cacheKey);

        // Invalidate workspace departments list cache
        await this.redis.del(REDIS_KEY_DEPARTMENTS_BY_WORKSPACE(workspaceId));
        await this.redis.del(REDIS_KEY_ACTIVE_DEPARTMENTS_BY_WORKSPACE(workspaceId));
        await this.redis.del(REDIS_KEY_AVAILABLE_DEPARTMENTS_BY_WORKSPACE(workspaceId));
        await this.redis.del(REDIS_KEY_DEPARTMENT_AGENTS(departmentId));

        this.logger.log(`Department deleted successfully: ${departmentId}`, 'DepartmentsService');
        return {
            message: 'Department deleted successfully',
            deletedDepartment,
        };
    }

    async activateDepartment(departmentId: string, workspaceId: string) {

        this.logger.log(`Activating department ${departmentId} in workspace ${workspaceId}`, 'DepartmentsService');

        // Check if department exists and belongs to the workspace
        const existingDepartment = await this.prisma.department.findFirst({
            where: {
                id: departmentId,
                workspaceId: workspaceId,
            },
        });

        if (!existingDepartment) {
            this.logger.warn(`Department not found for activation: ${departmentId} in workspace ${workspaceId}`, 'DepartmentsService');
            throw new NotFoundException(`Department with ID '${departmentId}' not found`);
        }

        if (existingDepartment.isActive) {
            this.logger.warn(`Department already active: ${departmentId}`, 'DepartmentsService');
            throw new ConflictException('Department is already active');
        }

        // Activate department
        const activatedDepartment = await this.prisma.department.update({
            where: {
                id: departmentId,
            },
            data: {
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                icon: true,
                isActive: true,
                workspaceId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // Update cache
        const cacheKey = REDIS_KEY_DEPARTMENT(departmentId);
        await this.redis.setex(cacheKey, REDIS_TTL_DEPARTMENT, JSON.stringify(activatedDepartment));

        // Invalidate workspace departments list cache
        await this.redis.del(REDIS_KEY_DEPARTMENTS_BY_WORKSPACE(workspaceId));
        // Invalidate active departments cache
        await this.redis.del(REDIS_KEY_ACTIVE_DEPARTMENTS_BY_WORKSPACE(workspaceId));
        // Invalidate available departments cache
        await this.redis.del(REDIS_KEY_AVAILABLE_DEPARTMENTS_BY_WORKSPACE(workspaceId));

        this.logger.log(`Department activated successfully: ${departmentId}`, 'DepartmentsService');
        return activatedDepartment;
    }

    async deactivateDepartment(departmentId: string, workspaceId: string) {

        this.logger.log(`Deactivating department ${departmentId} in workspace ${workspaceId}`, 'DepartmentsService');

        // Check if department exists and belongs to the workspace
        const existingDepartment = await this.prisma.department.findFirst({
            where: {
                id: departmentId,
                workspaceId: workspaceId,
            },
        });

        if (!existingDepartment) {
            this.logger.warn(`Department not found for deactivation: ${departmentId} in workspace ${workspaceId}`, 'DepartmentsService');
            throw new NotFoundException(`Department with ID '${departmentId}' not found`);
        }

        if (!existingDepartment.isActive) {
            this.logger.warn(`Department already inactive: ${departmentId}`, 'DepartmentsService');
            throw new ConflictException('Department is already inactive');
        }

        // Deactivate department
        const deactivatedDepartment = await this.prisma.department.update({
            where: {
                id: departmentId,
            },
            data: {
                isActive: false,
            },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                icon: true,
                isActive: true,
                workspaceId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // Update cache
        const cacheKey = REDIS_KEY_DEPARTMENT(departmentId);
        await this.redis.setex(cacheKey, REDIS_TTL_DEPARTMENT, JSON.stringify(deactivatedDepartment));

        // Invalidate workspace departments list cache
        await this.redis.del(REDIS_KEY_DEPARTMENTS_BY_WORKSPACE(workspaceId));

        // Invalidate active departments cache
        await this.redis.del(REDIS_KEY_ACTIVE_DEPARTMENTS_BY_WORKSPACE(workspaceId));
        // Invalidate available departments cache
        await this.redis.del(REDIS_KEY_AVAILABLE_DEPARTMENTS_BY_WORKSPACE(workspaceId));

        this.logger.log(`Department deactivated successfully: ${departmentId}`, 'DepartmentsService');
        return deactivatedDepartment;
    }

    async assignAgentsToDepartment(departmentId: string, agentIds: string[], workspaceId: string, assignerId: string, reason?: string) {
        // Check if department exists and belongs to the workspace
        const existingDepartment = await this.prisma.department.findFirst({
            where: {
                id: departmentId,
                workspaceId: workspaceId,
            },
        });

        if (!existingDepartment) {
            this.logger.warn(`Department not found for agent assignment: ${departmentId} in workspace ${workspaceId}`, 'DepartmentsService');
            throw new NotFoundException(`Department with ID '${departmentId}' not found`);
        }

        // Check if all agents exist and belong to the workspace
        const agents = await this.prisma.user.findMany({
            where: {
                id: { in: agentIds },
                workspaceId: workspaceId,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        if (agents.length !== agentIds.length) {
            this.logger.warn(`Some agents not found for assignment to department: ${departmentId}`, 'DepartmentsService');
            throw new NotFoundException('One or more agents not found in the workspace');
        }

        // Find already assigned agent IDs
        const alreadyAssigned = await this.prisma.user_Departments.findMany({
            where: {
                departmentId,
                userId: { in: agentIds },
            },
            select: { userId: true },
        });
        const alreadyAssignedIds = new Set(alreadyAssigned.map(a => a.userId));

        // Filter out agents already assigned
        const toAssign = agentIds.filter(id => !alreadyAssignedIds.has(id));

        // Assign new agents
        await Promise.all(
            toAssign.map(userId =>
                this.prisma.user_Departments.create({
                    data: {
                        userId,
                        departmentId,
                        assignedBy: assignerId,
                        assignedReason: reason || 'System Assigned',
                    },
                })
            )
        );

        // Return all assigned agents (including previously assigned)
        const assignedAgents = agents.map(agent => ({
            ...agent,
            assignedAt: new Date(),
        }));

        this.logger.log(`Agents assigned to department successfully: ${departmentId}`, 'DepartmentsService');
        // Invalidate agent statuses and available departments cache
        await this.redis.del(REDIS_KEY_DEPARTMENT_AGENTS(departmentId));
        await this.redis.del(REDIS_KEY_AVAILABLE_DEPARTMENTS_BY_WORKSPACE(workspaceId));
        return {
            message: 'Agents assigned to department successfully',
            departmentId,
            assignedAgents,
            totalAssigned: assignedAgents.length,
        };
    }

    async getAgentsInDepartment(departmentId: string, workspaceId: string) {
        // Check if department exists and belongs to the workspace
        const existingDepartment = await this.prisma.department.findFirst({
            where: {
                id: departmentId,
                workspaceId: workspaceId,
            },
            select: {
                id: true,
                name: true,
            },
        });

        if (!existingDepartment) {
            throw new NotFoundException(`Department with ID '${departmentId}' not found`);
        }

        // Get all agents assigned to this department
        const agentAssignments = await this.prisma.user_Departments.findMany({
            where: {
                departmentId,
                user: {
                    workspaceId: workspaceId,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                assignedAt: 'desc',
            },
        });

        const agents = agentAssignments.map(assignment => ({
            id: assignment.user.id,
            name: assignment.user.name,
            email: assignment.user.email,
            assignedAt: assignment.assignedAt,
            assignedBy: assignment.assignedBy,
            assignedReason: assignment.assignedReason,
        }));

        return {
            departmentId: existingDepartment.id,
            departmentName: existingDepartment.name,
            agents,
            totalAgents: agents.length,
        };
    }

    async removeAgentsFromDepartment(departmentId: string, agentIds: string[], workspaceId: string) {
        // Check if department exists and belongs to the workspace
        const existingDepartment = await this.prisma.department.findFirst({
            where: {
                id: departmentId,
                workspaceId: workspaceId,
            },
        });

        if (!existingDepartment) {
            throw new NotFoundException(`Department with ID '${departmentId}' not found`);
        }

        // Check if all agents exist and belong to the workspace
        const agents = await this.prisma.user.findMany({
            where: {
                id: { in: agentIds },
                workspaceId: workspaceId,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        if (agents.length !== agentIds.length) {
            throw new NotFoundException('One or more agents not found in the workspace');
        }

        // Find existing assignments to remove
        const existingAssignments = await this.prisma.user_Departments.findMany({
            where: {
                departmentId,
                userId: { in: agentIds },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (existingAssignments.length === 0) {
            throw new NotFoundException('No agents found assigned to this department');
        }

        // Remove agent assignments
        await this.prisma.user_Departments.deleteMany({
            where: {
                departmentId,
                userId: { in: agentIds },
            },
        });

        const removedAgents = existingAssignments.map(assignment => ({
            id: assignment.user.id,
            name: assignment.user.name,
            email: assignment.user.email,
            removedAt: new Date(),
        }));

        // Invalidate agent statuses and available departments cache
        await this.redis.del(REDIS_KEY_DEPARTMENT_AGENTS(departmentId));
        await this.redis.del(REDIS_KEY_AVAILABLE_DEPARTMENTS_BY_WORKSPACE(workspaceId));

        return {
            message: 'Agents removed from department successfully',
            departmentId,
            removedAgents,
            totalRemoved: removedAgents.length,
        };
    }

    async getAvailableDepartments(workspaceId: string) {
        // Try cache first
        const cacheKey = REDIS_KEY_AVAILABLE_DEPARTMENTS_BY_WORKSPACE(workspaceId);
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            this.logger.log(`Available departments retrieved from cache for workspace: ${workspaceId}`, 'DepartmentsService');
            return JSON.parse(cached);
        }

        // Fetch from database
        const availableDepartments = await this.prisma.department.findMany({
            where: {
                workspaceId: workspaceId,
                isActive: true,
                status: {
                    in: ['AVAILABLE', 'BUSY']
                }
            },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                icon: true,
                isActive: true,
                status: true,
                workspaceId: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Cache result
        await this.redis.setex(cacheKey, REDIS_TTL_AVAILABLE_DEPARTMENT_LIST, JSON.stringify(availableDepartments));

        this.logger.log(`Available departments retrieved from database for workspace: ${workspaceId}`, 'DepartmentsService');
        return availableDepartments;
    }

    async updateDepartmentStatus(departmentId: string, workspaceId: string) {
        this.logger.log(`Updating department status for department: ${departmentId} in workspace: ${workspaceId}`, 'DepartmentsService');

        try {
            // 1. CACHE FIRST - Get department from cache first
            const departmentKey = REDIS_KEY_DEPARTMENT(departmentId);
            let departmentData: any = await this.redis.get(departmentKey);

            if (departmentData) {
                departmentData = JSON.parse(departmentData);
            } else {
                // Fallback to database if not in cache
                const dbDepartment = await this.prisma.department.findFirst({
                    where: {
                        id: departmentId,
                        workspaceId: workspaceId,
                    },
                });

                if (!dbDepartment) {
                    this.logger.warn(`Department not found for status update: ${departmentId}`, 'DepartmentsService');
                    throw new NotFoundException(`Department with ID '${departmentId}' not found`);
                }

                departmentData = dbDepartment;
            }

            // 2. CACHE FIRST - Get agent statuses from cache first
            const agentStatuses = await this.getAgentStatusesFromCache(departmentId, workspaceId);

            // 3. CACHE FIRST - Calculate new status based on cached agent availability
            const newStatus = this.calculateDepartmentStatusFromCache(agentStatuses);

            // 4. Persist status immediately in the database
            await this.prisma.department.update({
                where: { id: departmentId },
                data: { status: newStatus },
            });

            // 5. Update caches and invalidate related lists
            await this.updateDepartmentStatusInCache(departmentId, workspaceId, newStatus);

            this.logger.log(`Department status updated to ${newStatus} for department: ${departmentId}`, 'DepartmentsService');

            return {
                departmentId,
                newStatus,
                message: `Department status updated to ${newStatus}`,
            };
        } catch (error) {
            this.logger.error(`Failed to update department status: ${error.message}`, 'DepartmentsService');
            throw error;
        }
    }

    private async getAgentStatusesFromCache(departmentId: string, workspaceId: string): Promise<any[]> {
        try {
            // Try to get agent statuses from cache first
            const agentStatusesKey = REDIS_KEY_DEPARTMENT_AGENTS(departmentId);
            const cachedAgentStatuses = await this.redis.get(agentStatusesKey);

            if (cachedAgentStatuses) {
                return JSON.parse(cachedAgentStatuses);
            }

            // Fallback to database if not in cache
            const agentAssignments = await this.prisma.user_Departments.findMany({
                where: {
                    departmentId,
                    user: {
                        workspaceId: workspaceId,
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            agentStatus: {
                                select: {
                                    status: true,
                                }
                            }
                        }
                    }
                }
            });

            // Cache the agent statuses for future use
            await this.redis.setex(agentStatusesKey, REDIS_TTL_DEPARTMENT_AGENT_STATUSES, JSON.stringify(agentAssignments));

            return agentAssignments;
        } catch (error) {
            this.logger.warn(`Failed to get agent statuses from cache: ${error.message}`, 'DepartmentsService');
            return [];
        }
    }

    private calculateDepartmentStatusFromCache(agentAssignments: any[]): 'AVAILABLE' | 'BUSY' | 'OFFLINE' {
        if (!agentAssignments || agentAssignments.length === 0) {
            return 'OFFLINE';
        }

        const agentsWithStatus = agentAssignments.filter(ud => ud.user.agentStatus);

        if (agentsWithStatus.length === 0) {
            return 'OFFLINE';
        }

        const onlineAgents = agentsWithStatus.filter(ud => ud.user.agentStatus.status === 'ONLINE');
        const busyAgents = agentsWithStatus.filter(ud => ud.user.agentStatus.status === 'BUSY');

        // If even one agent is ONLINE, department is AVAILABLE
        if (onlineAgents.length > 0) {
            return 'AVAILABLE';
        }

        // If all agents are BUSY, department is BUSY
        if (busyAgents.length > 0 && busyAgents.length === agentsWithStatus.length) {
            return 'BUSY';
        }

        // Otherwise, department is OFFLINE
        return 'OFFLINE';
    }

    private async updateDepartmentStatusInCache(departmentId: string, workspaceId: string, newStatus: string) {
        try {
            // Update department cache
            const departmentKey = REDIS_KEY_DEPARTMENT(departmentId);
            const cachedDepartment = await this.redis.get(departmentKey);

            if (cachedDepartment) {
                const department = JSON.parse(cachedDepartment);
                department.status = newStatus;
                department.updatedAt = new Date().toISOString();
                await this.redis.setex(departmentKey, REDIS_TTL_DEPARTMENT, JSON.stringify(department));
            }

            // Invalidate available departments cache since status changed
            await this.redis.del(REDIS_KEY_AVAILABLE_DEPARTMENTS_BY_WORKSPACE(workspaceId));

            this.logger.log(`Department status updated in cache: ${departmentId} to ${newStatus}`, 'DepartmentsService');
        } catch (error) {
            this.logger.warn(`Failed to update department status in cache: ${error.message}`, 'DepartmentsService');
        }
    }
} 