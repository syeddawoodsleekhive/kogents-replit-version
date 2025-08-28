import { Injectable, ConflictException, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { Redis } from 'ioredis';
import { UpdateWidgetDto } from './dtos/update-widget.dto';
import { Prisma, WidgetPosition, WidgetSize, WidgetSoundType } from '@prisma/client';

@Injectable()
export class WidgetService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLoggerService,
        @Inject('REDIS_CONNECTION') private readonly redis: Redis,
    ) { }

    private static readonly REDIS_KEYS = {
        DEFAULT_WIDGET: (workspaceId: string) => `widget_default:${workspaceId}`,
        WIDGET: (widgetId: string) => `widget:${widgetId}`,
    };

    private static readonly REDIS_TTL = {
        WIDGET: 30 * 60, // 30 minutes
    };

    async createDefaultWidget(workspaceId: string, tx: Prisma.TransactionClient = this.prisma) {
        const [
            { id: widgetColorId },
            { id: widgetSoundId },
            { id: widgetBehaviorId },
            { id: widgetContentId },
            { id: preChatFormId },
            { id: offlineChatFormId },
            { id: postChatFormId },
            { id: userInfoFormId },
            { id: badgeChatFormId },
            { id: widgetSecurityId },
        ] = await Promise.all([
            tx.widgetColors.create({ data: {}, select: { id: true } }),
            tx.widgetSound.create({ data: {}, select: { id: true } }),
            tx.widgetBehavior.create({ data: {}, select: { id: true } }),
            tx.widgetContent.create({ data: {}, select: { id: true } }),
            tx.preChatForm.create({ data: {}, select: { id: true } }),
            tx.offlineChatForm.create({ data: {}, select: { id: true } }),
            tx.postChatForm.create({ data: {}, select: { id: true } }),
            tx.userInfoForm.create({ data: {}, select: { id: true } }),
            tx.badgeChatForm.create({ data: {}, select: { id: true } }),
            tx.widgetSecurity.create({ data: {}, select: { id: true } }),
        ]);

        const [{ id: widgetAppearanceId }, { id: widgetFormsId }] = await Promise.all([
            tx.widgetAppearance.create({
                data: { widgetColorId },
                select: { id: true },
            }),
            tx.widgetForms.create({
                data: {
                    preChatFormId,
                    offlineChatFormId,
                    postChatFormId,
                    userInfoFormId,
                    badgeChatFormId,
                },
                select: { id: true },
            }),
        ]);

        const { id: widgetSettingsId } = await tx.widgetSettings.create({
            data: {
                appearanceId: widgetAppearanceId,
                soundId: widgetSoundId,
                behaviorId: widgetBehaviorId,
                formsId: widgetFormsId,
                securityId: widgetSecurityId,
                contentId: widgetContentId,
            },
            select: { id: true },
        });

        const widget = await tx.widget.create({
            data: {
                workspaceId,
                settingsId: widgetSettingsId,
            },
        });

        await this.redis.set(
            WidgetService.REDIS_KEYS.DEFAULT_WIDGET(workspaceId),
            JSON.stringify(widget)
        );

        this.logger.log(`Default widget created for workspace ${workspaceId}`, 'WidgetService');

        return widget;
    }

    async getDefaultWidget(workspaceId: string) {
        // Try cache first
        const cachedWidget = await this.redis.get(WidgetService.REDIS_KEYS.DEFAULT_WIDGET(workspaceId));

        if (cachedWidget) {
            this.logger.log(`Default widget cache found for workspace ${workspaceId}`, 'WidgetService');
            return JSON.parse(cachedWidget);
        } else {
            this.logger.log(`Default widget cache missing for workspace ${workspaceId}`, 'WidgetService');
            return null;
        }
    }

    async getWidgetById(widgetId: string) {
        const cachedWidget = await this.redis.get(WidgetService.REDIS_KEYS.WIDGET(widgetId));

        if (cachedWidget) {
            this.logger.log(`Widget cache found for widget ${widgetId}`, 'WidgetService');
            return JSON.parse(cachedWidget);
        }

        const widget = await this.prisma.widget.findFirst({
            where: { id: widgetId },
            include: {
                settings: {
                    include: {
                        appearance: { include: { colors: true } },
                        sound: true,
                        behavior: true,
                        content: true,
                        forms: {
                            include: {
                                preChatForm: true,
                                offlineChatForm: true,
                                postChatForm: true,
                                userInfoForm: true,
                                badgeChatForm: true,
                            }
                        },
                        security: true,
                    }
                }
            }
        });

        if (!widget) {
            throw new NotFoundException('Widget not found for the provided widgetId');
        }

        this.logger.log(`Widget found in database for widgetId ${widgetId}`, 'WidgetService');

        await this.redis.setex(WidgetService.REDIS_KEYS.WIDGET(widgetId), WidgetService.REDIS_TTL.WIDGET, JSON.stringify(widget));

        return widget;
    }

    async updateWidget(workspaceId: string, widgetId: string, dto: UpdateWidgetDto) {
        const widget = await this.prisma.widget.findFirst({
            where: { id: widgetId, workspaceId },
            include: {
                settings: {
                    include: {
                        appearance: { include: { colors: true } },
                        sound: true,
                        behavior: true,
                        content: true,
                        forms: {
                            include: {
                                preChatForm: true,
                                offlineChatForm: true,
                                postChatForm: true,
                                userInfoForm: true,
                                badgeChatForm: true,
                            }
                        },
                        security: true,
                    }
                }
            }
        });

        if (!widget) {
            throw new NotFoundException('Widget not found for the provided workspaceId and widgetId');
        }

        await this.prisma.$transaction(async (tx) => {
            // Widget active flag
            await tx.widget.update({
                where: { id: widget.id },
                data: { isActive: dto.active }
            });

            // Appearance + colors
            await tx.widgetColors.update({
                where: { id: widget.settings.appearance.colors.id },
                data: {
                    primary: dto.appearance.colors.primary,
                    secondary: dto.appearance.colors.secondary,
                    background: dto.appearance.colors.background,
                    text: dto.appearance.colors.text,
                }
            });

            await tx.widgetAppearance.update({
                where: { id: widget.settings.appearance.id },
                data: {
                    chatBadge: dto.appearance.chatBadge,
                    fontSize: dto.appearance.fontSize,
                    fontFamily: dto.appearance.fontFamily,
                    position: dto.appearance.position as WidgetPosition,
                    borderRadius: dto.appearance.borderRadius,
                    size: dto.appearance.size as WidgetSize,
                    customSizeWidth: dto.appearance.customSize?.width ?? null,
                    customSizeHeight: dto.appearance.customSize?.height ?? null,
                    showAvatar: dto.appearance.showAvatar,
                    showCompanyLogo: dto.appearance.showCompanyLogo,
                    companyLogoUrl: dto.appearance.companyLogo ?? null,
                }
            });

            // Sound
            await tx.widgetSound.update({
                where: { id: widget.settings.sound.id },
                data: {
                    enabled: dto.sound.enabled,
                    volume: dto.sound.volume,
                    type: dto.sound.type as WidgetSoundType,
                    hapticFeedback: dto.sound.hapticFeedback,
                }
            });

            // Behavior
            await tx.widgetBehavior.update({
                where: { id: widget.settings.behavior.id },
                data: {
                    autoOpen: dto.behavior.autoOpen,
                    autoOpenDelay: dto.behavior.autoOpenDelay,
                    offlineMode: dto.behavior.offlineMode,
                    reduceAnimations: dto.behavior.reduceAnimation,
                    autoClose: dto.behavior.autoClose,
                    autoCloseDelay: dto.behavior.autoCloseDelay,
                }
            });

            // Content
            await tx.widgetContent.update({
                where: { id: widget.settings.content.id },
                data: {
                    welcomeMessage: dto.content.welcomeMessage,
                    inputPlaceholder: dto.content.inputPlaceholder,
                    thankyouMessage: dto.content.thankyouMessage,
                }
            });

            // Forms (sub-forms)
            await tx.preChatForm.update({
                where: { id: widget.settings.forms.preChatFormId },
                data: {
                    enabled: dto.forms.preChatForm.enabled,
                    required: dto.forms.preChatForm.required,
                    preChatGreeting: dto.forms.preChatForm.preChatGreeting,
                    requireIdentity: dto.forms.preChatForm.requireIdentity,
                    requirePhone: dto.forms.preChatForm.requirePhone,
                    requireQuestion: dto.forms.preChatForm.requireQuestion,
                }
            });

            await tx.offlineChatForm.update({
                where: { id: widget.settings.forms.offlineChatFormId },
                data: {
                    enabled: dto.forms.offlineChatForm.enabled,
                    offlineChatGreeting: dto.forms.offlineChatForm.offlineChatGreeting,
                    requirePhone: dto.forms.offlineChatForm.requirePhone,
                }
            });

            await tx.postChatForm.update({
                where: { id: widget.settings.forms.postChatFormId },
                data: {
                    enabled: dto.forms.postChatForm.enabled,
                    required: dto.forms.postChatForm.required,
                    postChatGreeting: dto.forms.postChatForm.postChatGreeting,
                    requireRating: dto.forms.postChatForm.requireRating,
                    requireFeedback: dto.forms.postChatForm.requireFeedback,
                }
            });

            await tx.userInfoForm.update({
                where: { id: widget.settings.forms.userInfoFormId },
                data: {
                    enabled: dto.forms.userInfoForm.enabled,
                    required: dto.forms.userInfoForm.required,
                }
            });

            // Replace user info fields
            await tx.userInfoFields.deleteMany({ where: { userInfoFormId: widget.settings.forms.userInfoFormId } });
            if (Array.isArray(dto.forms.userInfoForm.fields) && dto.forms.userInfoForm.fields.length) {
                for (const f of dto.forms.userInfoForm.fields) {
                    await tx.userInfoFields.create({
                        data: {
                            id: f.id,
                            label: f.label,
                            type: f.type,
                            placeholder: f.placeholder ?? '',
                            required: !!f.required,
                            options: f.options ?? [],
                            userInfoFormId: widget.settings.forms.userInfoFormId,
                        }
                    });
                }
            }

            await tx.badgeChatForm.update({
                where: { id: widget.settings.forms.badgeChatFormId },
                data: {
                    enabled: dto.forms.badgeChatForm.enabled,
                }
            });

            // Security
            await tx.widgetSecurity.update({
                where: { id: widget.settings.security.id },
                data: {
                    domainRestriction: dto.security.domainRestriction,
                    allowedDomains: dto.security.allowedDomains ?? [],
                    countryRestriction: dto.security.countryRestriction,
                    blockedCountries: dto.security.blockedCountries ?? [],
                }
            });
        });

        this.logger.log(`Widget updated for workspace ${workspaceId} and widgetId ${widgetId}`, 'WidgetService');

        await this.redis.del(WidgetService.REDIS_KEYS.WIDGET(widgetId));

        return this.prisma.widget.findFirst({
            where: { id: widgetId, workspaceId },
            include: {
                settings: {
                    include: {
                        appearance: { include: { colors: true } },
                        sound: true,
                        behavior: true,
                        content: true,
                        forms: {
                            include: {
                                preChatForm: true,
                                offlineChatForm: true,
                                postChatForm: true,
                                userInfoForm: { include: { userInfoFields: true } },
                                badgeChatForm: true,
                            }
                        },
                        security: true,
                    }
                }
            }
        });
    }
}