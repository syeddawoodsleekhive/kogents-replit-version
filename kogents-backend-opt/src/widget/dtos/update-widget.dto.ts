import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ColorsDto {
    @ApiProperty() @IsString() primary: string;
    @ApiProperty() @IsString() secondary: string;
    @ApiProperty() @IsString() background: string;
    @ApiProperty() @IsString() text: string;
}

class CustomSizeDto {
    @ApiProperty() @IsNumber() width: number;
    @ApiProperty() @IsNumber() height: number;
}

class AppearanceDto {
    @ApiProperty() @IsBoolean() chatBadge: boolean;
    @ApiProperty({ type: ColorsDto }) @ValidateNested() @Type(() => ColorsDto) colors: ColorsDto;
    @ApiProperty() @IsNumber() fontSize: number;
    @ApiProperty() @IsString() fontFamily: string;
    @ApiProperty({ description: 'bottom-right | bottom-left | top-right | top-left' }) @IsString() position: string;
    @ApiProperty() @IsNumber() borderRadius: number;
    @ApiProperty({ description: 'small | medium | large' }) @IsString() size: string;
    @ApiProperty({ type: CustomSizeDto }) @ValidateNested() @Type(() => CustomSizeDto) @IsOptional() customSize?: CustomSizeDto;
    @ApiProperty() @IsBoolean() showAvatar: boolean;
    @ApiProperty() @IsBoolean() showCompanyLogo: boolean;
    @ApiProperty() @IsString() @IsOptional() companyLogo?: string;
}

class SoundDto {
    @ApiProperty() @IsBoolean() enabled: boolean;
    @ApiProperty() @IsNumber() volume: number;
    @ApiProperty({ description: 'message | notification | alert' }) @IsString() type: string;
    @ApiProperty() @IsBoolean() hapticFeedback: boolean;
}

class BehaviorDto {
    @ApiProperty() @IsBoolean() autoOpen: boolean;
    @ApiProperty() @IsNumber() autoOpenDelay: number; // ms or seconds; both accepted
    @ApiProperty() @IsBoolean() offlineMode: boolean;
    @ApiProperty() @IsBoolean() reduceAnimation: boolean;
    @ApiProperty() @IsBoolean() autoClose: boolean;
    @ApiPropertyOptional() @IsOptional() @IsNumber() autoCloseDelay?: number; // ms or seconds
}

class ContentDto {
    @ApiProperty() @IsString() welcomeMessage: string;
    @ApiProperty() @IsString() inputPlaceholder: string;
    @ApiProperty() @IsString() thankyouMessage: string;
}

class PreChatFormDto {
    @ApiProperty() @IsBoolean() enabled: boolean;
    @ApiProperty() @IsBoolean() required: boolean;
    @ApiProperty() @IsString() preChatGreeting: string;
    @ApiProperty() @IsBoolean() requireIdentity: boolean;
    @ApiProperty() @IsBoolean() requirePhone: boolean;
    @ApiProperty() @IsBoolean() requireQuestion: boolean;
}

class OfflineChatFormDto {
    @ApiProperty() @IsBoolean() enabled: boolean;
    @ApiProperty() @IsString() offlineChatGreeting: string;
    @ApiProperty() @IsBoolean() requirePhone: boolean;
}

class PostChatFormDto {
    @ApiProperty() @IsBoolean() enabled: boolean;
    @ApiProperty() @IsBoolean() required: boolean;
    @ApiProperty() @IsString() postChatGreeting: string;
    @ApiProperty() @IsBoolean() requireRating: boolean;
    @ApiProperty() @IsBoolean() requireFeedback: boolean;
}

class UserInfoFieldDto {
    @ApiProperty() @IsString() id: string;
    @ApiProperty() @IsString() label: string;
    @ApiProperty() @IsString() type: string;
    @ApiProperty() @IsString() @IsOptional() placeholder?: string;
    @ApiProperty() @IsBoolean() required: boolean;
    @ApiProperty() @IsArray() @IsOptional() options?: any[];
}

class UserInfoFormDto {
    @ApiProperty() @IsBoolean() enabled: boolean;
    @ApiProperty() @IsBoolean() required: boolean;
    @ApiProperty({ type: [UserInfoFieldDto] }) @ValidateNested({ each: true }) @Type(() => UserInfoFieldDto) fields: UserInfoFieldDto[];
}

class BadgeChatFormDto {
    @ApiProperty() @IsBoolean() enabled: boolean;
}

class FormsDto {
    @ApiProperty({ type: PreChatFormDto }) @ValidateNested() @Type(() => PreChatFormDto) preChatForm: PreChatFormDto;
    @ApiProperty({ type: OfflineChatFormDto }) @ValidateNested() @Type(() => OfflineChatFormDto) offlineChatForm: OfflineChatFormDto;
    @ApiProperty({ type: PostChatFormDto }) @ValidateNested() @Type(() => PostChatFormDto) postChatForm: PostChatFormDto;
    @ApiProperty({ type: UserInfoFormDto }) @ValidateNested() @Type(() => UserInfoFormDto) userInfoForm: UserInfoFormDto;
    @ApiProperty({ type: BadgeChatFormDto }) @ValidateNested() @Type(() => BadgeChatFormDto) badgeChatForm: BadgeChatFormDto;
}

class SecurityDto {
    @ApiProperty() @IsBoolean() domainRestriction: boolean;
    @ApiProperty({ type: [String] }) @IsArray() allowedDomains: string[];
    @ApiProperty() @IsBoolean() countryRestriction: boolean;
    @ApiProperty({ type: [String] }) @IsArray() blockedCountries: string[];
}

export class UpdateWidgetDto {
    @ApiProperty() @IsBoolean() active: boolean;

    @ApiProperty({ type: AppearanceDto }) @ValidateNested() @Type(() => AppearanceDto) appearance: AppearanceDto;
    @ApiProperty({ type: SoundDto }) @ValidateNested() @Type(() => SoundDto) sound: SoundDto;
    @ApiProperty({ type: BehaviorDto }) @ValidateNested() @Type(() => BehaviorDto) behavior: BehaviorDto;
    @ApiProperty({ type: ContentDto }) @ValidateNested() @Type(() => ContentDto) content: ContentDto;
    @ApiProperty({ type: FormsDto }) @ValidateNested() @Type(() => FormsDto) forms: FormsDto;
    @ApiProperty({ type: SecurityDto }) @ValidateNested() @Type(() => SecurityDto) security: SecurityDto;
}