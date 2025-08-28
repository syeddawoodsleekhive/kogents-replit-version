import Axios from "@/lib/axios";
import { WidgetAppearanceModel } from "@/types/appearance";
import { WidgetSettings } from "@/types/widget";

interface saveWidgetSettingsType {
  id: string;
  settings: WidgetSettings;
  workspaceId: string;
}

export const saveWidgetSettings = ({
  id,
  settings,
  workspaceId,
}: saveWidgetSettingsType) => {
  const formattedData = formatSendData(settings, workspaceId);

  return Axios.patch(`/widget-appearance/${id}`, formattedData);
};

export const getWidgetSettings = (
  workspaceId: string
): Promise<WidgetSettings | null> => {
  return Axios.get(`/widget-appearance/workspace/${workspaceId}`)
    .then((res) => {
      if (res) {
        const formattedData = formatReceivedData(
          res.data.data || res.data._doc,
          workspaceId
        );
        return formattedData;
      }
      return null;
    })
    .catch((err) => {
      console.error(err);
      return null;
    });
};

const formatSendData = (
  settings: WidgetSettings,
  workspaceId: string
): WidgetAppearanceModel => {
  return {
    active: settings.integration.widgetStatus,
    workspace: workspaceId,
    appearance: {
      chatBadge: settings.content.chatBadge.enabled,
      colors: {
        primary: settings.appearance.primaryColor,
        secondary: settings.appearance.secondaryColor,
        background: settings.appearance.backgroundColor,
        text: settings.appearance.textColor,
      },
      fontSize: settings.appearance.customFont
        ? settings.appearance.customFontSize
        : settings.appearance.fontSize === "small"
        ? 14
        : settings.appearance.fontSize === "medium"
        ? 16
        : settings.appearance.fontSize === "large"
        ? 18
        : 14,
      fontFamily: settings.appearance.fontFamily,
      position: settings.appearance.position,
      borderRadius: settings.appearance.borderRadius,
      size: settings.appearance.customeChatSize
        ? "custom"
        : settings.appearance.size,
      customSize: settings.appearance.chatSize,
      showAvatar: settings.appearance.showAgentAvatar,
      showCompanyLogo: settings.appearance.showCompanyLogo,
      companyLogo: settings.appearance.logo,
    },
    sound: {
      enabled: settings.sound.soundEnabled,
      volume: settings.sound.soundVolume,
      type: settings.sound.currentSoundType.toLowerCase() as any,
      hapticFeedback: settings.sound.hapticEnabled,
    },
    behavior: {
      autoOpen: settings.behavior.autoOpen,
      autoOpenDelay: settings.behavior.autoOpenDelay,
      offlineMode: settings.behavior.offlineMode.enabled,
      reduceAnimation: settings.behavior.reduceAnimations,
      autoClose: settings.behavior.autoMinimize.enabled,
      autoCloseDelay: settings.behavior.autoMinimize.timeout,
    },
    content: {
      welcomeMessage: settings.content.welcomeMessage,
      inputPlaceholder: settings.content.placeholderText,
      thankyouMessage: settings.content.thankYouMessage,
    },
    forms: {
      preChatForm: {
        enabled: settings.content.preChatForm.enabled,
        required: settings.content.preChatForm.required,
        preChatGreeting: settings.content.preChatForm.greetingsMessage,
        requireIdentity: settings.content.preChatForm.isIdentityRequired,
        requirePhone: settings.content.preChatForm.isPhoneRequired,
        requireQuestion: settings.content.preChatForm.isQuestionRequired,
      },
      offlineChatForm: {
        enabled: settings.content.offlineChatForm.enabled,
        offlineChatGreeting: settings.content.offlineChatForm.greetingsMessage,
        requirePhone: settings.content.offlineChatForm.isPhoneRequired,
      },
      postChatForm: {
        enabled: settings.content.postChatSurvey.enabled,
        required: settings.content.postChatSurvey.required,
        postChatGreeting: settings.content.postChatSurvey.thankYouMessage,
        requireRating: settings.content.postChatSurvey.isRatingsRequired,
        requireFeedback: settings.content.postChatSurvey.isFeedbackRequired,
      },
      userInfoForm: {
        enabled: settings.content.userInfoForm.enabled,
        required: settings.content.userInfoForm.required,
        fields: settings.content.userInfoForm.fields.map((field) => ({
          label: field.label,
          type: field.type,
          placeholder: field.placeholder || "",
          required: field.required,
          options: field.options,
        })),
      },
    },
    security: {
      domainRestriction: settings.security.isDomainsAllowed,
      allowedDomains: settings.security.allowedDomains,
      blockedCountries: settings.security.bannedCountries,
    },
  };
};

export const formatReceivedData = (
  data: WidgetAppearanceModel,
  workspaceId: string
): WidgetSettings => {
  return {
    id: data?._id || "",
    isActive: true,
    appearance: {
      primaryColor: data.appearance.colors.primary,
      secondaryColor: data.appearance.colors.secondary,
      backgroundColor: data.appearance.colors.background,
      textColor: data.appearance.colors.text,
      customFontSize: data.appearance.fontSize,
      fontSize:
        data.appearance.fontSize === 14
          ? "small"
          : data.appearance.fontSize === 16
          ? "medium"
          : data.appearance.fontSize === 18
          ? "large"
          : "medium",
      fontFamily: data.appearance.fontFamily,
      position: data.appearance.position,
      borderRadius: data.appearance.borderRadius,
      size: data.appearance.size === "custom" ? "medium" : data.appearance.size,
      customeChatSize: data.appearance.size === "custom",
      chatSize: data.appearance.customSize || {
        width: 340,
        height: 500,
      },
      showAgentAvatar: data.appearance.showAvatar,
      showCompanyLogo: data.appearance.showCompanyLogo,
      logo: data.appearance.companyLogo || "",
      customFont: false,
      theme: "light",
    },
    sound: {
      soundEnabled: data.sound.enabled,
      soundVolume: data.sound.volume,
      currentSoundType:
        data.sound.type.charAt(0).toUpperCase() + data.sound.type.slice(1),
      hapticEnabled: data.sound.hapticFeedback,
    },
    behavior: {
      autoOpen: data.behavior.autoOpen,
      autoOpenDelay: data.behavior.autoOpenDelay,
      reduceAnimations: data.behavior.reduceAnimation,
      offlineMode: {
        enabled: data.behavior.offlineMode,
        autoReply: "",
        collectEmail: false,
        message: "",
      },
      autoMinimize: {
        enabled: data.behavior.autoClose,
        timeout: data.behavior.autoCloseDelay,
      },
      showOnPages: [],
      hideOnPages: [],
      imageCompression: {
        enabled: false,
        size: 0,
        quality: 0,
      },
      operatingHours: {
        enabled: false,
        timezone: "UTC",
        schedule: [],
      },
      proactiveChat: {
        enabled: false,
        message: "",
        conditions: [],
        delay: 0,
      },
      screenReaderOptimization: false,
      triggerRules: [],
    },
    content: {
      chatBadge: {
        enabled: data.appearance.chatBadge,
      },
      welcomeMessage: data.content.welcomeMessage,
      placeholderText: data.content.inputPlaceholder,
      thankYouMessage: data.content.thankyouMessage,
      preChatForm: {
        enabled: data.forms.preChatForm.enabled,
        required: data.forms.preChatForm.required,
        greetingsMessage: data.forms.preChatForm.preChatGreeting,
        isIdentityRequired: data.forms.preChatForm.requireIdentity,
        isPhoneRequired: data.forms.preChatForm.requirePhone,
        isQuestionRequired: data.forms.preChatForm.requireQuestion,
      },
      offlineChatForm: {
        enabled: data.forms.offlineChatForm.enabled,
        greetingsMessage: data.forms.offlineChatForm.offlineChatGreeting,
        isPhoneRequired: data.forms.offlineChatForm.requirePhone,
        required: false,
      },
      postChatSurvey: {
        enabled: data.forms.postChatForm.enabled,
        required: data.forms.postChatForm.required,
        thankYouMessage: data.forms.postChatForm.postChatGreeting,
        isRatingsRequired: data.forms.postChatForm.requireRating,
        isFeedbackRequired: data.forms.postChatForm.requireFeedback,
        feedback: "",
        ratings: 0,
      },
      userInfoForm: {
        enabled: data.forms.userInfoForm.enabled,
        required: data.forms.userInfoForm.required,
        fields:
          data.forms.userInfoForm.fields?.map((field, index) => ({
            id: "",
            type: field.type as any,
            label: field.label,
            placeholder: field.placeholder,
            required: field.required,
            order: index + 1,
          })) || [],
        showUserInfoForm: false,
      },
      translations: {},
      formType: "chat-window",
      isFirstTime: false,
      language: "en",
      offlineMessage: "",
    },
    security: {
      isDomainsAllowed: data.security.domainRestriction,
      allowedDomains: data.security.allowedDomains || [],
      bannedCountries: data.security.blockedCountries || [],
      isBannedCountries: false,
      domainRestrictions: [],
      ipRestrictions: [],
      rateLimiting: {
        enabled: false,
        maxRequests: 0,
        timeWindow: 0,
      },
      encryption: false,
      gdprCompliant: false,
      dataRetentionDays: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    name: "Chat Widget",
    integration: {
      embedCode: "",
      apiKey: workspaceId,
      webhookUrl: "",
      allowedDomains: [],
      widgetStatus: data.active,
      customFields: [],
      analytics: {},
    },
  };
};
