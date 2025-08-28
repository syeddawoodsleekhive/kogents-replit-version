import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsIn, IsNumber, IsObject, IsBoolean } from 'class-validator';

export class CreateInteractionDto {
    @ApiProperty({
        description: 'Session token to link interaction data',
        example: 'sess_1234567890abcdef',
        type: String
    })
    @IsNotEmpty({ message: 'Session token is required' })
    @IsString({ message: 'Session token must be a string' })
    sessionToken: string;

    @ApiProperty({
        description: 'Type of interaction',
        example: 'form_field',
        enum: [
            'form_field',
            'scroll',
            'click',
            'hover',
            'navigation',
            'keyboard',
            'touch',
            'gesture'
        ]
    })
    @IsNotEmpty({ message: 'Interaction type is required' })
    @IsIn([
        'form_field',
        'scroll',
        'click',
        'hover',
        'navigation',
        'keyboard',
        'touch',
        'gesture'
    ], { message: 'Invalid interaction type' })
    interactionType: string;

    @ApiProperty({
        description: 'Field name (for form interactions)',
        example: 'email',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Field name must be a string' })
    fieldName?: string;

    @ApiProperty({
        description: 'Element ID',
        example: 'submit-button',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Element ID must be a string' })
    elementId?: string;

    @ApiProperty({
        description: 'Element class',
        example: 'btn-primary',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Element class must be a string' })
    elementClass?: string;

    @ApiProperty({
        description: 'Element text',
        example: 'Submit',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Element text must be a string' })
    elementText?: string;

    @ApiProperty({
        description: 'Behavior type (for user behaviors)',
        example: 'scroll',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Behavior type must be a string' })
    behaviorType?: string;

    @ApiProperty({
        description: 'Timestamp in milliseconds since session start',
        example: 15000,
        type: Number
    })
    @IsNotEmpty({ message: 'Timestamp is required' })
    @IsNumber({}, { message: 'Timestamp must be a number' })
    timestampMs: number;

    @ApiProperty({
        description: 'Duration in milliseconds',
        example: 500,
        type: Number
    })
    @IsOptional()
    @IsNumber({}, { message: 'Duration must be a number' })
    duration?: number;

    @ApiProperty({
        description: 'Coordinates {x, y}',
        example: { x: 100, y: 200 },
        type: 'object',
        additionalProperties: true
    })
    @IsOptional()
    @IsObject({ message: 'Coordinates must be an object' })
    coordinates?: { x: number; y: number };

    @ApiProperty({
        description: 'Scroll position {x, y}',
        example: { x: 0, y: 100 },
        type: 'object',
        additionalProperties: true
    })
    @IsOptional()
    @IsObject({ message: 'Scroll position must be an object' })
    scrollPosition?: { x: number; y: number };

    @ApiProperty({
        description: 'Viewport size {width, height}',
        example: { width: 1920, height: 1080 },
        type: 'object',
        additionalProperties: true
    })
    @IsOptional()
    @IsObject({ message: 'Viewport size must be an object' })
    viewportSize?: { width: number; height: number };

    @ApiProperty({
        description: 'Page URL',
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

    // Form interaction specific fields
    @ApiProperty({
        description: 'Field focus time in milliseconds',
        example: 2000,
        type: Number
    })
    @IsOptional()
    @IsNumber({}, { message: 'Field focus time must be a number' })
    fieldFocusTime?: number;

    @ApiProperty({
        description: 'Typing speed in characters per second',
        example: 2.5,
        type: Number
    })
    @IsOptional()
    @IsNumber({}, { message: 'Typing speed must be a number' })
    typingSpeed?: number;

    @ApiProperty({
        description: 'Whether field was completed',
        example: true,
        type: Boolean
    })
    @IsOptional()
    @IsBoolean({ message: 'Field completed must be a boolean' })
    fieldCompleted?: boolean;

    @ApiProperty({
        description: 'Whether validation passed',
        example: true,
        type: Boolean
    })
    @IsOptional()
    @IsBoolean({ message: 'Validation passed must be a boolean' })
    validationPassed?: boolean;

    @ApiProperty({
        description: 'Error message',
        example: 'Invalid email format',
        type: String
    })
    @IsOptional()
    @IsString({ message: 'Error message must be a string' })
    errorMessage?: string;

    @ApiProperty({
        description: 'Number of attempts',
        example: 1,
        type: Number
    })
    @IsOptional()
    @IsNumber({}, { message: 'Attempts count must be a number' })
    attemptsCount?: number;

    @ApiProperty({
        description: 'Input length',
        example: 25,
        type: Number
    })
    @IsOptional()
    @IsNumber({}, { message: 'Input length must be a number' })
    inputLength?: number;

    @ApiProperty({
        description: 'Number of backspaces',
        example: 3,
        type: Number
    })
    @IsOptional()
    @IsNumber({}, { message: 'Backspace count must be a number' })
    backspaceCount?: number;

    @ApiProperty({
        description: 'Whether paste was detected',
        example: false,
        type: Boolean
    })
    @IsOptional()
    @IsBoolean({ message: 'Paste detected must be a boolean' })
    pasteDetected?: boolean;

    @ApiProperty({
        description: 'Whether autocomplete was used',
        example: true,
        type: Boolean
    })
    @IsOptional()
    @IsBoolean({ message: 'Autocomplete used must be a boolean' })
    autocompleteUsed?: boolean;
} 