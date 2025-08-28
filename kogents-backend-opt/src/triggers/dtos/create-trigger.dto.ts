import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActionType, PredicateOperator, TriggerConditionField, TriggerEvent } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';

export class ConditionLeafDto {
    @ApiProperty({ enum: TriggerConditionField })
    @IsEnum(TriggerConditionField)
    field: TriggerConditionField;

    @ApiProperty({ enum: PredicateOperator })
    @IsEnum(PredicateOperator)
    operator: PredicateOperator;

    // Accept string | number | boolean. We'll infer the target column in service
    @ApiProperty({
        oneOf: [
            { type: 'string' }, { type: 'number' }, { type: 'boolean' },
        ]
    })
    primaryValue: string | number | boolean;

    @ApiPropertyOptional({
        oneOf: [
            { type: 'string' }, { type: 'number' }, { type: 'boolean' },
        ]
    })
    @IsOptional()
    secondaryValue?: string | number | boolean;
}

// Union-like DTO: either a leaf or a group. Validation of exclusivity is enforced in the service.
export class ConditionNodeDto {
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

    @ApiPropertyOptional({ type: () => [ConditionNodeDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ConditionNodeDto)
    AND?: ConditionNodeDto[];

    @ApiPropertyOptional({ type: () => [ConditionNodeDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ConditionNodeDto)
    OR?: ConditionNodeDto[];
}

export class TriggerActionDto {
    @ApiProperty({ enum: ActionType })
    @IsEnum(ActionType)
    type: ActionType;

    @ApiProperty({ minimum: 0 })
    @IsInt()
    @Min(0)
    sortOrder: number;

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

export class CreateTriggerDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    departmentId?: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    // Using "triggerEvent" in the DTO to match the provided JSON shape
    @ApiProperty({ enum: TriggerEvent })
    @IsEnum(TriggerEvent)
    triggerEvent: TriggerEvent;

    @ApiProperty()
    @IsBoolean()
    enabled: boolean;

    @ApiProperty({ minimum: 1 })
    @IsInt()
    @Min(1)
    priority: number;

    @ApiProperty({ type: () => ConditionNodeDto })
    @IsObject()
    @ValidateNested()
    @Type(() => ConditionNodeDto)
    conditions: ConditionNodeDto;

    @ApiProperty({ type: () => [TriggerActionDto] })
    @IsArray()
    @ArrayMaxSize(100)
    @ValidateNested({ each: true })
    @Type(() => TriggerActionDto)
    actions: TriggerActionDto[];
}