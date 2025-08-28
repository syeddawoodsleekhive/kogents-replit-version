export interface TranslationKeys {
  mainPage: {
    title: string
    description: string
    buttons: {
      viewDemo: string
      documentation: string
    }
    integration: {
      title: string
      description: string
    }
    debug: {
      currentLanguage: string
      direction: string
      rtl: string
      browserLanguage: string
    }
  }
  widget: {
    header: {
      aiAssistant: string
      liveAgent: string
      liveChatSupport: string
      online: string
      offline: string
      connecting: string
      connected: string
      disconnected: string
      fullscreen: string
      minimize: string
      close: string
    }
    button: {
      open: string
      close: string
      chat: string
      cancel: string
      submit: string
      send: string
      sendMessage: string
    }
    input: {
      placeholder: string
      typing: string
      send: string
      attachment: string
      emoji: string
      moreOptions: string
      attachFiles: string
    }
    messages: {
      agent: string
      aiAgent: string
      liveAgent: string
      typing: string
      connecting: string
      connectionLost: string
      socketConnected: string
      newMessage: string
      unreadMessages: string
      processing: string
      processingMessage: string
      pleaseWait: string
      justNow: string
    }
    forms: {
      preChatForm: {
        greeting: string
        name: string
        email: string
        phone: string
        question: string
        enterName: string
        enterEmail: string
        enterPhone: string
        enterQuery: string
        optional: string
        required: string
        sendMessage: string
      }
      postChatForm: {
        greeting: string
        rating: string
        feedback: string
        enterFeedback: string
        submit: string
        optional: string
        required: string
      }
      offlineChatForm: {
        greeting: string
        name: string
        email: string
        phone: string
        question: string
        enterName: string
        enterEmail: string
        enterPhone: string
        enterQuery: string
        sendMessage: string
        optional: string
        required: string
      }
    }
    errors: {
      failed: string
      error: string
      validationError: string
      fieldRequired: string
      fillAllFields: string
      connectionError: string
      uploadFailed: string
      processingFailed: string
    }
    file: {
      loading: string
      cancel: string
      remove: string
      upload: string
      failed: string
      dropFilesHere: string
    }
    accessibility: {
      chatOpened: string
      chatClosed: string
      chatButtonDisabled: string
      chatButtonEnabled: string
      chatButtonFocused: string
      fullscreen: string
      windowed: string
      scrollToBottom: string
      closeChat: string
      openChat: string
      unreadMessage: string
    }
    status: {
      connectionLost: string
      connecting: string
    }
    navigation: {
      scrollToBottom: string
      newMessage: string
      newMessages: string
    }
    branding: {
      poweredBy: string
    }
  }
}

export type SupportedLanguage =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "nl"
  | "pl"
  | "ru"
  | "ja"
  | "ko"
  | "zh"
  | "ar"
  | "he"
  | "hi"
  | "bn"
  | "ur"
  | "fa"
  | "tr"
  | "sv"
  | "da"
  | "no"
  | "fi"
  | "cs"
  | "sk"
  | "hu"
  | "ro"
  | "bg"
  | "hr"
  | "sr"
  | "sl"
  | "et"
  | "lv"
  | "lt"
  | "uk"
  | "be"
  | "mk"
  | "sq"
  | "mt"
  | "is"
  | "ga"
  | "cy"
  | "eu"
  | "ca"
  | "gl"
  | "ast"
  | "oc"
  | "co"
  | "sc"
  | "rm"
  | "fur"
  | "lld"
  | "vec"
  | "lmo"
  | "pms"
  | "th"
  | "vi"
  | "id"
  | "ms"
  | "tl"
  | "sw"
  | "am"
  | "ti"
  | "om"
  | "so"
  | "mg"
  | "ny"
  | "sn"
  | "zu"

export interface LanguageConfig {
  code: SupportedLanguage
  name: string
  nativeName: string
  rtl?: boolean
}
