import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Param,
    UseGuards,
    Req,
    UnauthorizedException,
    Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { WidgetService } from './widget.service';
import { UpdateWidgetDto } from './dtos/update-widget.dto';
import { AppLoggerService } from '../common/logger/app-logger.service';
import {
    ApiValidationError,
    ApiNotFoundError,
    ApiInternalServerError
} from '../common/decorators/api-error-response.decorator';
import { AuthenticatedRequest, PermissionsGuard, RequirePermissions } from 'src/common';

@ApiTags('Widget')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('widget')
export class WidgetController {
    constructor(
        private readonly widgetService: WidgetService,
        private readonly logger: AppLoggerService
    ) { }

    @Put(':widgetId')
    @RequirePermissions({ canEdit: true })
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Edit widget',
        description: 'Update a widget by workspaceId and widgetId with a complete JSON payload.'
    })
    @ApiParam({ name: 'workspaceId', type: String })
    @ApiParam({ name: 'widgetId', type: String })
    @ApiBody({ type: UpdateWidgetDto })
    @ApiOkResponse({ description: 'Widget updated successfully.' })
    @ApiValidationError()
    @ApiNotFoundError()
    @ApiInternalServerError()
    async editWidget(
        @Req() req: AuthenticatedRequest,
        @Param('widgetId') widgetId: string,
        @Body() dto: UpdateWidgetDto
    ) {

        if (!req.user.workspaceId) {
            throw new UnauthorizedException('Unauthorized. Please login again.');
        }

        this.logger.log(`Editing widget ${widgetId} for workspace ${req.user.workspaceId}`, 'WidgetController');
        return this.widgetService.updateWidget(req.user.workspaceId, widgetId, dto);
    }
}