import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { ApiValidationError, ApiUnauthorizedError, ApiForbiddenError, ApiConflictError, ApiInternalServerError, ApiNotFoundError } from '../common/decorators/api-error-response.decorator';
import { AuthenticatedRequest } from '../common/types/auth-request.interface';
import { TriggersService } from './triggers.service';
import { CreateTriggerDto } from './dtos/create-trigger.dto';
import { FindTriggersDto } from './dtos/find-triggers.dto';
import { UpdateTriggerDto } from './dtos/update-trigger.dto';
import { UpdateTriggerStatusDto } from './dtos/update-trigger-status.dto';

@ApiTags('Triggers')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('triggers')
export class TriggersController {
    constructor(
        private readonly triggersService: TriggersService,
    ) { }

    @Post('create')
    @RequirePermissions({ canCreate: true })
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a trigger' })
    @ApiBody({ type: CreateTriggerDto })
    @ApiCreatedResponse({ description: 'Trigger created' })
    @ApiValidationError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiConflictError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async createTrigger(@Body() dto: CreateTriggerDto, @Request() req: AuthenticatedRequest) {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.triggersService.createTrigger(req.user.workspaceId, dto, req.user.userId);
    }

    @Get()
    @RequirePermissions({ canRead: true })
    @ApiOperation({ summary: 'List triggers with metrics' })
    @ApiQuery({ name: 'departmentId', required: false })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    @ApiOkResponse({ description: 'Triggers retrieved' })
    @ApiValidationError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiInternalServerError()
    async findTriggers(@Query() query: FindTriggersDto, @Request() req: AuthenticatedRequest) {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.triggersService.findTriggers(req.user.workspaceId, query);
    }

    @Patch(':triggerId/status')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({ summary: 'Update trigger status' })
    @ApiParam({ name: 'triggerId' })
    @ApiBody({ type: UpdateTriggerStatusDto })
    @ApiOkResponse({ description: 'Trigger status updated' })
    @ApiValidationError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async updateTriggerStatus(@Param('triggerId') triggerId: string, @Body() dto: UpdateTriggerStatusDto, @Request() req: AuthenticatedRequest) {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.triggersService.updateTriggerStatus(req.user.workspaceId, triggerId, dto.enabled, dto.departmentId);
    }

    @Put(':triggerId')
    @RequirePermissions({ canEdit: true })
    @ApiOperation({ summary: 'Update a trigger' })
    @ApiParam({ name: 'triggerId' })
    @ApiBody({ type: UpdateTriggerDto })
    @ApiOkResponse({ description: 'Trigger updated' })
    @ApiValidationError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async updateTrigger(@Param('triggerId') triggerId: string, @Body() dto: UpdateTriggerDto, @Request() req: AuthenticatedRequest) {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.triggersService.updateTrigger(req.user.workspaceId, triggerId, dto);
    }

    @Delete(':triggerId')
    @RequirePermissions({ canDelete: true })
    @ApiOperation({ summary: 'Delete a trigger' })
    @ApiParam({ name: 'triggerId' })
    @ApiOkResponse({ description: 'Trigger deleted' })
    @ApiValidationError()
    @ApiUnauthorizedError()
    @ApiForbiddenError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async deleteTrigger(@Param('triggerId') triggerId: string, @Request() req: AuthenticatedRequest) {
        if (!req.user?.workspaceId) {
            throw new ForbiddenException('Unauthorized: Invalid JWT. Please login again.');
        }
        return this.triggersService.deleteTrigger(req.user.workspaceId, triggerId);
    }
}