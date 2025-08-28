import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActionType, PredicateOperator, TriggerConditionField, TriggerEvent } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class UpdateConditionNodeDto {
    @ApiPropertyOptional({ enum: TriggerConditionField })
    @IsOptional()
    @IsEnum(TriggerConditionField)
    field?: TriggerConditionField;

    @ApiPropertyOptional({ enum: PredicateOperator })
    @IsOptional()
    @IsEnum(PredicateOperator)
    operator?: PredicateOperator;

    @ApiPropertyOptional({
        oneOf: [
            { type: 'string' }, { type: 'number' }, { type: 'boolean' },
        ]
    })
    @IsOptional()
    primaryValue?: string | number | boolean;

    @ApiPropertyOptional({
        oneOf: [
            { type: 'string' }, { type: 'number' }, { type: 'boolean' },
        ]
    })
    @IsOptional()
    secondaryValue?: string | number | boolean;

    @ApiPropertyOptional({ type: () => [UpdateConditionNodeDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateConditionNodeDto)
    AND?: UpdateConditionNodeDto[];

    @ApiPropertyOptional({ type: () => [UpdateConditionNodeDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateConditionNodeDto)
    OR?: UpdateConditionNodeDto[];
}

export class UpdateTriggerActionDto {
    @ApiPropertyOptional({ enum: ActionType })
    @IsOptional()
    @IsEnum(ActionType)
    type?: ActionType;

    @ApiPropertyOptional({ minimum: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    primaryIntValue?: number | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    primaryStringValue?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    primaryBooleanValue?: boolean | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    secondaryIntValue?: number | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    secondaryStringValue?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    secondaryBooleanValue?: boolean | null;
}

export class UpdateTriggerDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string | null;

    @ApiPropertyOptional({ enum: TriggerEvent })
    @IsOptional()
    @IsEnum(TriggerEvent)
    triggerEvent?: TriggerEvent;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    @ApiPropertyOptional({ minimum: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    priority?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    departmentId?: string | null;

    // If provided, fully replaces existing conditions
    @ApiPropertyOptional({ type: () => UpdateConditionNodeDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateConditionNodeDto)
    conditions?: UpdateConditionNodeDto;

    // If provided, fully replaces existing actions
    @ApiPropertyOptional({ type: () => [UpdateTriggerActionDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateTriggerActionDto)
    actions?: UpdateTriggerActionDto[];
}


