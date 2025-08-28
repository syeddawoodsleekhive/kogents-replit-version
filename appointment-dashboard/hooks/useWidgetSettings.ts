"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  WidgetSettings,
  WidgetAppearance,
  WidgetBehavior,
  WidgetContent,
  WidgetIntegration,
  WidgetSecurity,
  WidgetSound,
} from "@/types/widget";
import { useUser } from "@/context/UserContext";
import { getWidgetSettings, saveWidgetSettings } from "@/api/widget";

// Mock data for demonstration
const mockWidgetSettings: WidgetSettings = {
  id: "1",
  name: "Main Website Widget",
  isActive: true,
  appearance: {
    theme: "light",
    primaryColor: "#3b82f6",
    secondaryColor: "#f3f4f6",
    textColor: "#1f2937",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    position: "bottom-right",
    size: "medium",
    customeChatSize: false,
    chatSize: {
      width: 340,
      height: 500,
    },
    fontFamily: "Inter",
    customFont: false,
    customFontSize: 14,
    fontSize: "medium",
    showAgentAvatar: true,
    showCompanyLogo: true,
    logo: "",
  },
  sound: {
    soundEnabled: true,
    hapticEnabled: true,
    soundVolume: 0.5,
    currentSoundType: "message",
  },
  behavior: {
    autoOpen: true,
    autoOpenDelay: 3000,
    showOnPages: ["*"],
    hideOnPages: [],
    reduceAnimations: false,
    screenReaderOptimization: false,
    operatingHours: {
      enabled: true,
      timezone: "UTC",
      schedule: [
        { day: "Monday", isOpen: true, openTime: "09:00", closeTime: "17:00" },
        { day: "Tuesday", isOpen: true, openTime: "09:00", closeTime: "17:00" },
        {
          day: "Wednesday",
          isOpen: true,
          openTime: "09:00",
          closeTime: "17:00",
        },
        {
          day: "Thursday",
          isOpen: true,
          openTime: "09:00",
          closeTime: "17:00",
        },
        { day: "Friday", isOpen: true, openTime: "09:00", closeTime: "17:00" },
        {
          day: "Saturday",
          isOpen: false,
          openTime: "09:00",
          closeTime: "17:00",
        },
        { day: "Sunday", isOpen: false, openTime: "09:00", closeTime: "17:00" },
      ],
    },
    proactiveChat: {
      enabled: true,
      delay: 30000,
      message: "Hi! How can we help you today?",
      conditions: ["time_on_page > 30s"],
    },
    triggerRules: [
      {
        id: "1",
        name: "Exit Intent",
        type: "exit_intent",
        value: "",
        action: "show_widget",
        isActive: true,
      },
    ],
    offlineMode: {
      enabled: false,
      message:
        "We're currently offline. Please leave a message and we'll get back to you.",
      collectEmail: true,
      autoReply: "Thank you for your message. We'll get back to you soon!",
    },
    autoMinimize: {
      enabled: false,
      timeout: 30000,
    },
    imageCompression: {
      enabled: true,
      size: 1,
      quality: 30,
    },
  },
  content: {
    welcomeMessage: "Welcome! How can we help you?",
    offlineMessage:
      "We're currently offline. Please leave a message and we'll get back to you.",
    placeholderText: "Type your message...",
    thankYouMessage: "Thank you for contacting us!",
    language: "en",
    translations: {},
    isFirstTime: true,
    formType: "chat-window",
    preChatForm: {
      enabled: true,
      required: false,
      greetingsMessage: "Welcome! How can we help you?",
      isIdentityRequired: true,
      isPhoneRequired: false,
      isQuestionRequired: false,
    },
    offlineChatForm: {
      enabled: true,
      required: false,
      greetingsMessage:
        "Sorry we aren't online at the moment. Leave a message and we will get back to you",
      isPhoneRequired: true,
    },
    userInfoForm: {
      enabled: true,
      required: false,
      showUserInfoForm: false,
      fields: [
        {
          id: "1",
          type: "text",
          label: "Name",
          placeholder: "Enter your name",
          required: true,
          order: 1,
        },
        {
          id: "2",
          type: "email",
          label: "Email",
          placeholder: "Enter your email",
          required: true,
          order: 2,
        },
      ],
    },
    chatBadge: {
      enabled: true,
    },
    postChatSurvey: {
      enabled: true,
      required: false,
      isRatingsRequired: false,
      ratings: 0,
      isFeedbackRequired: false,
      feedback: "",
      thankYouMessage: "Thank you for your feedback!",
      // questions: [
      //   {
      //     id: "1",
      //     type: "rating",
      //     question: "How would you rate our service?",
      //     required: true,
      //   },
      // ],
    },
  },
  integration: {
    embedCode: "",
    apiKey: "widget_key_123",
    allowedDomains: ["example.com", "www.example.com"],
    widgetStatus: true,
    customFields: [],
    analytics: {},
  },
  security: {
    isDomainsAllowed: false,
    allowedDomains: ["example.com", "www.example.com"],
    isBannedCountries: false,
    bannedCountries: [],
    domainRestrictions: [],
    ipRestrictions: [],
    rateLimiting: {
      enabled: true,
      maxRequests: 100,
      timeWindow: 3600,
    },
    encryption: true,
    gdprCompliant: true,
    dataRetentionDays: 365,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function useWidgetSettings() {
  const [defaultSettings, setDefaultSettings] =
    useState<typeof mockWidgetSettings>(mockWidgetSettings);
  const [settings, setSettings] =
    useState<typeof mockWidgetSettings>(mockWidgetSettings);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { workspace } = useUser();

  const updateAppearance = useCallback(
    (appearance: Partial<WidgetAppearance>) => {
      setSettings((prev) => ({
        ...prev,
        appearance: { ...prev.appearance, ...appearance },
        updatedAt: new Date(),
      }));
    },
    []
  );

  const updateSoundSettings = useCallback((sound: Partial<WidgetSound>) => {
    setSettings((prev) => ({
      ...prev,
      sound: { ...prev.sound, ...sound },
      updatedAt: new Date(),
    }));
  }, []);

  const updateBehavior = useCallback((behavior: Partial<WidgetBehavior>) => {
    setSettings((prev) => ({
      ...prev,
      behavior: { ...prev.behavior, ...behavior },
      updatedAt: new Date(),
    }));
  }, []);

  const updateContent = useCallback((content: Partial<WidgetContent>) => {
    setSettings((prev) => ({
      ...prev,
      content: { ...prev.content, ...content },
      updatedAt: new Date(),
    }));
  }, []);

  const updateIntegration = useCallback(
    (integration: Partial<WidgetIntegration>) => {
      setSettings((prev) => ({
        ...prev,
        integration: { ...prev.integration, ...integration },
        updatedAt: new Date(),
      }));
    },
    []
  );

  const updateSecurity = useCallback((security: Partial<WidgetSecurity>) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, ...security },
      updatedAt: new Date(),
    }));
  }, []);

  const generateEmbedCode = useCallback(() => {
    const embedCode = `<!-- Begin Kogents Chat Widget -->
<script type="text/javascript">
  window.KogentsChat ||
    (function (d, s, id) {
      var w = (window.KogentsChat = function (c) {
        w._.push(c);
      });
      w._ = [];
      var e = d.createElement(s);
      e.async = true;
      e.id = id;
      e.src = "https://api.kogents.com/widget/embed.js?key=${
        workspace?._id || "api-key"
      }";
      var t = d.getElementsByTagName(s)[0];
      t.parentNode.insertBefore(e, t);
    })(document, "script", "kogents-chat-widget");
</script>
<!-- End Kogents Chat Widget -->`;

    return embedCode;
  }, [settings.id, settings.integration.apiKey, workspace]);

  const saveSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await saveWidgetSettings({
        id: settings.id,
        settings: settings,
        workspaceId: workspace?._id || "",
      });

      setDefaultSettings(settings);
      console.log("Settings saved:", settings);
    } catch (err) {
      setError("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  }, [settings, workspace]);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, [defaultSettings]);

  useEffect(() => {
    if (workspace?._id) {
      getWidgetSettings(workspace?._id).then((settingsData) => {
        if (settingsData) {
          setSettings(settingsData);
          setDefaultSettings(settingsData);
        }
      });
    }
  }, [workspace]);

  return {
    settings,
    isLoading,
    error,
    updateAppearance,
    updateBehavior,
    updateContent,
    updateIntegration,
    updateSecurity,
    updateSoundSettings,
    generateEmbedCode,
    saveSettings,
    resetSettings,
  };
}
