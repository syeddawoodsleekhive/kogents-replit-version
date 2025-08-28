import { useState, useCallback } from "react";
import axios from "axios";

export interface TranslationState {
  isTranslating: boolean;
  translatedMessages: { [key: string]: string };
  showTranslated: { [key: string]: boolean };
  detectedLanguage: string;
  targetLanguage: string;
  error: string | null;
  isLoading: boolean;
}

export const useTranslation = () => {
  const [state, setState] = useState<TranslationState>({
    isTranslating: false,
    translatedMessages: {},
    showTranslated: {},
    detectedLanguage: "English",
    targetLanguage: "English",
    error: null,
    isLoading: false,
  });

  // Translate a single message
  const translateMessage = useCallback(
    async (
      text: string,
      messageId: string,
      fromLang?: string,
      toLang?: string
    ): Promise<string | null> => {
      if (!text || text.trim().length === 0) return null;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await axios.post("/api/translate", {
          action: "translate",
          text,
          sourceLang: fromLang || state.detectedLanguage,
          targetLang: toLang || state.targetLanguage,
        });

        if (response.data.translatedText) {
          const translatedText = response.data.translatedText;

          setState((prev) => ({
            ...prev,
            translatedMessages: {
              ...prev.translatedMessages,
              [messageId]: translatedText,
            },
            isLoading: false,
            error: null,
          }));

          return translatedText;
        }

        throw new Error("Translation failed");
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error || error.message || "Translation failed";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    [state.detectedLanguage, state.targetLanguage]
  );

  // Detect language of text
  const detectLanguage = useCallback(async (text: string): Promise<string> => {
    if (!text || text.trim().length === 0) return "English";

    try {
      const response = await axios.post("/api/translate", {
        action: "detect",
        text,
      });

      if (response.data.detectedLanguage) {
        const detectedLang = response.data.detectedLanguage;
        setState((prev) => ({ ...prev, detectedLanguage: detectedLang }));
        return detectedLang;
      }

      return "English";
    } catch (error: any) {
      console.error("Language detection failed:", error);
      return "English";
    }
  }, []);

  // Toggle translation for a specific message
  const toggleTranslation = useCallback(
    async (message: any) => {
      const messageId = message.id || String(message.timestamp);

      // If we're showing translated text, switch back to original
      if (state.showTranslated[messageId]) {
        setState((prev) => ({
          ...prev,
          showTranslated: {
            ...prev.showTranslated,
            [messageId]: false,
          },
        }));
        return;
      }

      // If we're showing original text, translate this specific message
      if (!state.translatedMessages[messageId]) {
        const translated = await translateMessage(
          message.content,
          messageId,
          state.detectedLanguage,
          state.targetLanguage
        );

        if (translated) {
          // Show translated text
          setState((prev) => ({
            ...prev,
            showTranslated: {
              ...prev.showTranslated,
              [messageId]: true,
            },
          }));
        }
      } else {
        // Show translated text (already translated)
        setState((prev) => ({
          ...prev,
          showTranslated: {
            ...prev.showTranslated,
            [messageId]: true,
          },
        }));
      }
    },
    [
      state.showTranslated,
      state.translatedMessages,
      state.detectedLanguage,
      state.targetLanguage,
      translateMessage,
    ]
  );

  // Start translation mode
  const startTranslation = useCallback(
    async (messages: any[]) => {
      setState((prev) => ({ ...prev, isTranslating: true, error: null }));

      // Detect language from the first message
      if (messages.length > 0 && messages[0].content) {
        const detected = await detectLanguage(messages[0].content);
        setState((prev) => ({ ...prev, detectedLanguage: detected }));
      }
    },
    [detectLanguage]
  );

  // Stop translation mode
  const stopTranslation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isTranslating: false,
      showTranslated: {},
      error: null,
    }));
  }, []);

  // Set target language
  const setTargetLanguage = useCallback((language: string) => {
    setState((prev) => ({ ...prev, targetLanguage: language }));
  }, []);

  // Get translated text for a message
  const getTranslatedText = useCallback(
    (message: any) => {
      if (!state.isTranslating) return null;
      const messageId = message.id || String(message.timestamp);
      return state.translatedMessages[messageId] || null;
    },
    [state.isTranslating, state.translatedMessages]
  );

  // Check if a message should show translated text
  const shouldShowTranslated = useCallback(
    (message: any) => {
      const messageId = message.id || String(message.timestamp);
      return state.showTranslated[messageId] || false;
    },
    [state.showTranslated]
  );

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    translateMessage,
    detectLanguage,
    toggleTranslation,
    startTranslation,
    stopTranslation,
    setTargetLanguage,
    getTranslatedText,
    shouldShowTranslated,
    clearError,
  };
};
