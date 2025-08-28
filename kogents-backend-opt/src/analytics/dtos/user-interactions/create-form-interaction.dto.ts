import { IsNotEmpty, IsString, IsOptional, IsIn, IsNumber, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFormInteractionDto {
    @ApiProperty({
        description: 'Session token to link form interaction',
        example: 'sess_1234567890abcdef',
        type: String
    })
    @IsNotEmpty({ message: 'Session token is required' })
    @IsString({ message: 'Session token must be a string' })
    sessionToken: string;

    @ApiProperty({
        description: 'Name of the form field',
        example: 'email',
        type: String
    })
    @IsNotEmpty({ message: 'Field name is required' })
    @IsString({ message: 'Field name must be a string' })
    fieldName: string;

    @ApiProperty({
        description: 'Type of interaction with the field',
        example: 'focus',
        enum: ['focus', 'blur', 'input', 'validation_error', 'submit', 'change', 'paste', 'autocomplete'],
        type: String
    })
    @IsNotEmpty({ message: 'Interaction type is required' })
    @IsIn(['focus', 'blur', 'input', 'validation_error', 'submit', 'change', 'paste', 'autocomplete'], {
        message: 'Interaction type must be one of: focus, blur, input, validation_error, submit, change, paste, autocomplete'
    })
    interactionType: string;

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
        description: 'Time spent focused on the field in milliseconds',
        example: 5000,
        type: Number,
        required: false
    })
    @IsOptional()
    @IsNumber({}, { message: 'Field focus time must be a number' })
    @Min(0, { message: 'Field focus time must be at least 0' })
    fieldFocusTime?: number;

    @ApiProperty({
        description: 'Typing speed in characters per second',
        example: 2.5,
        type: Number,
        required: false
    })
    @IsOptional()
    @IsNumber({}, { message: 'Typing speed must be a number' })
    @Min(0, { message: 'Typing speed must be at least 0' })
    typingSpeed?: number;

    @ApiProperty({
        description: 'Whether the field was completed',
        example: true,
        type: Boolean,
        required: false
    })
    @IsOptional()
    @IsBoolean({ message: 'Field completed must be a boolean' })
    fieldCompleted?: boolean;

    @ApiProperty({
        description: 'Whether validation passed for this field',
        example: true,
        type: Boolean,
        required: false
    })
    @IsOptional()
    @IsBoolean({ message: 'Validation passed must be a boolean' })
    validationPassed?: boolean;

    @ApiProperty({
        description: 'Error message if validation failed',
        example: 'Invalid email format',
        type: String,
        required: false
    })
    @IsOptional()
    @IsString({ message: 'Error message must be a string' })
    errorMessage?: string;

    @ApiProperty({
        description: 'Number of attempts for this field',
        example: 1,
        type: Number,
        required: false,
        default: 1
    })
    @IsOptional()
    @IsNumber({}, { message: 'Attempts count must be a number' })
    @Min(1, { message: 'Attempts count must be at least 1' })
    attemptsCount?: number;

    @ApiProperty({
        description: 'Length of input in characters',
        example: 25,
        type: Number,
        required: false
    })
    @IsOptional()
    @IsNumber({}, { message: 'Input length must be a number' })
    @Min(0, { message: 'Input length must be at least 0' })
    inputLength?: number;

    @ApiProperty({
        description: 'Number of backspace key presses',
        example: 3,
        type: Number,
        required: false,
        default: 0
    })
    @IsOptional()
    @IsNumber({}, { message: 'Backspace count must be a number' })
    @Min(0, { message: 'Backspace count must be at least 0' })
    backspaceCount?: number;

    @ApiProperty({
        description: 'Whether paste was detected',
        example: false,
        type: Boolean,
        required: false,
        default: false
    })
    @IsOptional()
    @IsBoolean({ message: 'Paste detected must be a boolean' })
    pasteDetected?: boolean;

    @ApiProperty({
        description: 'Whether autocomplete was used',
        example: false,
        type: Boolean,
        required: false,
        default: false
    })
    @IsOptional()
    @IsBoolean({ message: 'Autocomplete used must be a boolean' })
    autocompleteUsed?: boolean;
} 