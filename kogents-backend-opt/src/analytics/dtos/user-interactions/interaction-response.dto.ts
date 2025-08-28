import { ApiProperty } from '@nestjs/swagger';

export class InteractionResponseDto {
    @ApiProperty({
        description: 'Unique interaction ID',
        example: 'clx1234567890abcdef',
        type: String
    })
    id: string;

    @ApiProperty({
        description: 'Session token linked to this interaction',
        example: 'sess_1234567890abcdef',
        type: String
    })
    sessionToken: string;

    @ApiProperty({
        description: 'Name of the form field (for form interactions)',
        example: 'email',
        type: String,
        nullable: true
    })
    fieldName: string | null;

    @ApiProperty({
        description: 'Type of interaction',
        example: 'focus',
        type: String
    })
    interactionType: string;

    @ApiProperty({
        description: 'Type of user behavior (for behavior tracking)',
        example: 'click',
        type: String,
        nullable: true
    })
    behaviorType: string | null;

    @ApiProperty({
        description: 'ID of the element that was interacted with',
        example: 'signup-button',
        type: String,
        nullable: true
    })
    elementId: string | null;

    @ApiProperty({
        description: 'CSS class of the element that was interacted with',
        example: 'btn-primary',
        type: String,
        nullable: true
    })
    elementClass: string | null;

    @ApiProperty({
        description: 'Text content of the element that was interacted with',
        example: 'Sign Up',
        type: String,
        nullable: true
    })
    elementText: string | null;

    @ApiProperty({
        description: 'Mouse/touch coordinates {x, y}',
        example: { x: 150, y: 200 },
        type: 'object',
        additionalProperties: true,
        nullable: true
    })
    coordinates: Record<string, any> | null;

    @ApiProperty({
        description: 'Scroll position {x, y}',
        example: { x: 0, y: 500 },
        type: 'object',
        additionalProperties: true,
        nullable: true
    })
    scrollPosition: Record<string, any> | null;

    @ApiProperty({
        description: 'Viewport size {width, height}',
        example: { width: 1920, height: 1080 },
        type: 'object',
        additionalProperties: true,
        nullable: true
    })
    viewportSize: Record<string, any> | null;

    @ApiProperty({
        description: 'Timestamp in milliseconds since session start',
        example: 15000,
        type: Number
    })
    timestampMs: number;

    @ApiProperty({
        description: 'Time spent focused on the field in milliseconds',
        example: 5000,
        type: Number,
        nullable: true
    })
    fieldFocusTime: number | null;

    @ApiProperty({
        description: 'Typing speed in characters per second',
        example: 2.5,
        type: Number,
        nullable: true
    })
    typingSpeed: number | null;

    @ApiProperty({
        description: 'Duration of the interaction in milliseconds',
        example: 250,
        type: Number,
        nullable: true
    })
    duration: number | null;

    @ApiProperty({
        description: 'Whether the field was completed',
        example: true,
        type: Boolean,
        nullable: true
    })
    fieldCompleted: boolean | null;

    @ApiProperty({
        description: 'Whether validation passed for this field',
        example: true,
        type: Boolean,
        nullable: true
    })
    validationPassed: boolean | null;

    @ApiProperty({
        description: 'Error message if validation failed',
        example: 'Invalid email format',
        type: String,
        nullable: true
    })
    errorMessage: string | null;

    @ApiProperty({
        description: 'Number of attempts for this field',
        example: 1,
        type: Number,
        nullable: true
    })
    attemptsCount: number | null;

    @ApiProperty({
        description: 'Length of input in characters',
        example: 25,
        type: Number,
        nullable: true
    })
    inputLength: number | null;

    @ApiProperty({
        description: 'Number of backspace key presses',
        example: 3,
        type: Number,
        nullable: true
    })
    backspaceCount: number | null;

    @ApiProperty({
        description: 'Whether paste was detected',
        example: false,
        type: Boolean,
        nullable: true
    })
    pasteDetected: boolean | null;

    @ApiProperty({
        description: 'Whether autocomplete was used',
        example: false,
        type: Boolean,
        nullable: true
    })
    autocompleteUsed: boolean | null;

    @ApiProperty({
        description: 'Current page URL',
        example: 'https://app.kogents.com/signup',
        type: String,
        nullable: true
    })
    pageUrl: string | null;

    @ApiProperty({
        description: 'Referrer URL',
        example: 'https://google.com',
        type: String,
        nullable: true
    })
    referrerUrl: string | null;

    @ApiProperty({
        description: 'Interaction creation time',
        example: '2024-01-15T10:30:00.000Z',
        type: String,
        format: 'date-time'
    })
    createdAt: Date;
} 