export type WidgetAppearanceModel = {
  _id?: string;
  workspace?: string;
  active: boolean;
  appearance: {
    chatBadge: boolean;
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
    };
    fontSize: number;
    fontFamily: string;
    position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
    borderRadius: number;
    size: "compact" | "medium" | "large" | "custom";
    customSize?: {
      width: number;
      height: number;
    };
    showAvatar: boolean;
    showCompanyLogo: boolean;
    companyLogo?: string;
  };
  sound: {
    enabled: boolean;
    volume: number;
    type: "message" | "alert" | "notification";
    hapticFeedback: boolean;
  };
  behavior: {
    autoOpen: boolean;
    autoOpenDelay: number;
    offlineMode: boolean;
    reduceAnimation: boolean;
    autoClose: boolean;
    autoCloseDelay: number;
  };
  content: {
    welcomeMessage: string;
    inputPlaceholder: string;
    thankyouMessage: string;
  };
  forms: {
    preChatForm: {
      enabled: boolean;
      required: boolean;
      preChatGreeting: string;
      requireIdentity: boolean;
      requirePhone: boolean;
      requireQuestion: boolean;
    };
    offlineChatForm: {
      enabled: boolean;
      offlineChatGreeting: string;
      requirePhone: boolean;
    };
    postChatForm: {
      enabled: boolean;
      required: boolean;
      postChatGreeting: string;
      requireRating: boolean;
      requireFeedback: boolean;
    };
    userInfoForm: {
      enabled: boolean;
      required: boolean;
      fields: Array<{
        id: string;
        label: string;
        type: "text" | "email" | "textarea" | "select" | "checkbox";
        placeholder: string;
        required: boolean;
        options?: string[];
      }>;
    };
    badgeChatForm: {
      enabled: boolean;
    }
  };
  security: {
    domainRestriction: boolean;
    allowedDomains?: string[];
    blockedCountries?: string[];
  };
};
