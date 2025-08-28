"use client";

import { useT } from "@/lib/i18n";
import { useLanguage } from "@/context/language-context";

export default function TranslationTest() {
  const t = useT();
  const { currentLanguage, isRTL, direction } = useLanguage();

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 p-4 rounded-lg shadow-lg border z-50 max-w-sm">
      <h3 className="font-bold mb-2">Translation Test</h3>
      <div className="space-y-1 text-sm">
        <p><strong>Language:</strong> {currentLanguage}</p>
        <p><strong>RTL:</strong> {isRTL ? "Yes" : "No"}</p>
        <p><strong>Direction:</strong> {direction}</p>
        <div className="mt-2 pt-2 border-t border-yellow-300">
          <p><strong>Main Title:</strong> {t('mainPage.title')}</p>
          <p><strong>Widget Header:</strong> {t('widget.header.aiAssistant')}</p>
          <p><strong>Widget Button:</strong> {t('widget.button.open')}</p>
          <p><strong>Widget Input:</strong> {t('widget.input.placeholder')}</p>
        </div>
      </div>
    </div>
  );
} 