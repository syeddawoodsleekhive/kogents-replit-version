import { WidgetAppearanceModel } from "@/types/appearance";

export const WidgetApp: WidgetAppearanceModel = {
  workspace: "6839eed33d520efddaa0b91b",
  active: true,
  appearance: {
    chatBadge: false,
    colors: {
      primary: "#3B82F6",
      secondary: "#eff6ff",
      background: "#ffffff",
      text: "#000000",
    },
    fontSize: 14,
    fontFamily: "Inter",
    position: "bottom-right",
    borderRadius: 8,
    size: "medium",
    customSize: {
      width: 380,
      height: 600,
    },
    showAvatar: true,
    showCompanyLogo: true,
    companyLogo: "",
  },
  sound: {
    enabled: true,
    volume: 1,
    type: "message",
    hapticFeedback: true,
  },
  behavior: {
    autoOpen: true,
    autoOpenDelay: 3000,
    offlineMode: false,
    reduceAnimation: false,
    autoClose: false,
    autoCloseDelay: 30000,
  },
  content: {
    welcomeMessage: "Welcome! How can we help you?",
    inputPlaceholder: "Type a message...",
    thankyouMessage: "Thank you for contacting us!",
  },
  forms: {
    preChatForm: {
      enabled: false,
      required: false,
      preChatGreeting: "Welcome! How can we help you?",
      requireIdentity: true,
      requirePhone: false,
      requireQuestion: false,
    },
    offlineChatForm: {
      enabled: false,
      offlineChatGreeting:
        "Sorry we aren't online at the moment. Leave a message and we will get back to you",
      requirePhone: true,
    },
    postChatForm: {
      enabled: false,
      required: false,
      postChatGreeting: "Thank you for your feedback!",
      requireRating: false,
      requireFeedback: false,
    },
    userInfoForm: {
      enabled: false,
      required: false,
      fields: [
        {
          id: "new-field",
          label: "Name",
          type: "text",
          placeholder: "",
          required: false,
          options: [],
        },
        {
          id: "new-field-2",
          label: "Email",
          type: "email",
          placeholder: "",
          required: false,
          options: [],
        },
      ],
    },
    badgeChatForm: {
      enabled: false,
    },
  },
  security: {
    domainRestriction: false,
    allowedDomains: [],
    blockedCountries: [],
  },
};
