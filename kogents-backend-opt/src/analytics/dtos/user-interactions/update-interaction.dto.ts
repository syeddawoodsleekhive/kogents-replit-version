import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsObject } from 'class-validator';

export class UpdateInteractionDto {
    @ApiPropertyOptional({ description: 'Time spent on page' })
    @IsOptional()
    @IsNumber()
    timeOnPage?: number;

    @ApiPropertyOptional({ description: 'Scroll depth percentage' })
    @IsOptional()
    @IsNumber()
    scrollDepth?: number;

    @ApiPropertyOptional({ description: 'Form data' })
    @IsOptional()
    @IsObject()
    formData?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Form errors' })
    @IsOptional()
    @IsArray()
    formErrors?: string[];

    @ApiPropertyOptional({ description: 'Form completion time' })
    @IsOptional()
    @IsNumber()
    formCompletionTime?: number;

    @ApiPropertyOptional({ description: 'Form field interactions' })
    @IsOptional()
    @IsArray()
    formFieldInteractions?: Array<{
        fieldName: string;
        fieldType: string;
        interactionType: string;
        timestamp: number;
        duration: number;
    }>;

    @ApiPropertyOptional({ description: 'Click sequence' })
    @IsOptional()
    @IsArray()
    clickSequence?: Array<{
        elementId: string;
        elementType: string;
        timestamp: number;
        coordinates: { x: number; y: number };
    }>;

    @ApiPropertyOptional({ description: 'Hover events' })
    @IsOptional()
    @IsArray()
    hoverEvents?: Array<{
        elementId: string;
        elementType: string;
        timestamp: number;
        duration: number;
    }>;

    @ApiPropertyOptional({ description: 'Scroll events' })
    @IsOptional()
    @IsArray()
    scrollEvents?: Array<{
        timestamp: number;
        scrollTop: number;
        scrollLeft: number;
        direction: string;
    }>;

    @ApiPropertyOptional({ description: 'Keyboard events' })
    @IsOptional()
    @IsArray()
    keyboardEvents?: Array<{
        key: string;
        keyCode: number;
        timestamp: number;
        elementId: string;
    }>;

    @ApiPropertyOptional({ description: 'Touch events' })
    @IsOptional()
    @IsArray()
    touchEvents?: Array<{
        type: string;
        timestamp: number;
        coordinates: { x: number; y: number };
        elementId: string;
    }>;

    @ApiPropertyOptional({ description: 'Gesture events' })
    @IsOptional()
    @IsArray()
    gestureEvents?: Array<{
        type: string;
        timestamp: number;
        coordinates: { x: number; y: number };
        distance: number;
        direction: string;
    }>;

    @ApiPropertyOptional({ description: 'Performance metrics' })
    @IsOptional()
    @IsObject()
    performanceMetrics?: {
        loadTime: number;
        domContentLoaded: number;
        firstPaint: number;
        firstContentfulPaint: number;
        largestContentfulPaint: number;
        cumulativeLayoutShift: number;
        firstInputDelay: number;
    };

    @ApiPropertyOptional({ description: 'Error events' })
    @IsOptional()
    @IsArray()
    errorEvents?: Array<{
        type: string;
        message: string;
        timestamp: number;
        stack?: string;
    }>;

    @ApiPropertyOptional({ description: 'Custom events' })
    @IsOptional()
    @IsArray()
    customEvents?: Array<{
        name: string;
        data: Record<string, any>;
        timestamp: number;
    }>;

    @ApiPropertyOptional({ description: 'Additional metadata' })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
} 