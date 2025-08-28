import { IsNotEmpty, IsString, IsOptional, IsIn, IsNumber, Min, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserBehaviorDto {
    @ApiProperty({
        description: 'Session token to link user behavior',
        example: 'sess_1234567890abcdef',
        type: String
    })
    @IsNotEmpty({ message: 'Session token is required' })
    @IsString({ message: 'Session token must be a string' })
    sessionToken: string;

    @ApiProperty({
        description: 'Type of user behavior',
        example: 'click',
        enum: ['click', 'scroll', 'hover', 'navigation', 'resize', 'focus', 'blur', 'keypress', 'mouse_move', 'touch', 'swipe', 'pinch', 'double_click', 'right_click', 'drag', 'drop', 'copy', 'paste', 'select', 'highlight'],
        type: String
    })
    @IsNotEmpty({ message: 'Behavior type is required' })
    @IsIn([
        'click', 'scroll', 'hover', 'navigation', 'resize', 'focus', 'blur', 'keypress',
        'mouse_move', 'touch', 'swipe', 'pinch', 'double_click', 'right_click',
        'drag', 'drop', 'copy', 'paste', 'select', 'highlight'
    ], {
        message: 'Behavior type must be one of the valid interaction types'
    })
    behaviorType: string;

    @ApiProperty({
        description: 'ID of the element that was interacted with',
        example: 'signup-button',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Element ID must be a string' })
    elementId?: string;

    @ApiProperty({
        description: 'CSS class of the element that was interacted with',
        example: 'btn-primary',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Element class must be a string' })
    elementClass?: string;

    @ApiProperty({
        description: 'Text content of the element that was interacted with',
        example: 'Sign Up',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Element text must be a string' })
    elementText?: string;

    @ApiProperty({
        description: 'Mouse/touch coordinates {x, y}',
        example: { x: 150, y: 200 },
        type: 'object',
        additionalProperties: true
    })
    @IsOptional()
    @IsObject({ message: 'Coordinates must be an object' })
    coordinates?: Record<string, any>;

    @ApiProperty({
        description: 'Scroll position {x, y}',
        example: { x: 0, y: 500 },
        type: 'object',
        additionalProperties: true
    })
    @IsOptional()
    @IsObject({ message: 'Scroll position must be an object' })
    scrollPosition?: Record<string, any>;

    @ApiProperty({
        description: 'Viewport size {width, height}',
        example: { width: 1920, height: 1080 },
        type: 'object',
        additionalProperties: true
    })
    @IsOptional()
    @IsObject({ message: 'Viewport size must be an object' })
    viewportSize?: Record<string, any>;

    @ApiProperty({
        description: 'Timestamp in milliseconds since session start',
        example: 15000,
        type: Number
    })
    @IsNotEmpty({ message: 'Timestamp is required' })
    @IsNumber({}, { message: 'Timestamp must be a number' })
    @Min(0, { message: 'Timestamp must be at least 0' })
    timestampMs: number;

    @ApiProperty({
        description: 'Duration of the interaction in milliseconds',
        example: 250,
        type: Number
    })
    @IsOptional()
    @IsNumber({}, { message: 'Duration must be a number' })
    @Min(0, { message: 'Duration must be at least 0' })
    duration?: number;

    @ApiProperty({
        description: 'Current page URL',
        example: 'https://app.kogents.com/signup',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Page URL must be a string' })
    pageUrl?: string;

    @ApiProperty({
        description: 'Referrer URL',
        example: 'https://google.com',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Referrer URL must be a string' })
    referrerUrl?: string;
} 