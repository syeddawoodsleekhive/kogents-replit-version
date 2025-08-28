"use client"

import Link from "next/link";
import { useAutoRTL } from "@/hooks/use-auto-rtl";
import { useTranslate } from "@/hooks/use-auto-translate";
import { useEffect, useState } from "react";
import TranslationTest from "@/components/translation-test";

// Fixed typo in env var name (but kept old for backward compatibility)
const API_KEY =
  process.env.NEXT_PUBLIC_WORKSPACE_ID ||
  process.env.NEXT_PULBIC_WORKSPACE_ID ||
  "";

export default function Home() {
  const { isRTL, direction, currentLanguage } = useAutoRTL();
  const t = useTranslate();
  const [browserLanguage, setBrowserLanguage] = useState<string>("");

  // Auto-detect browser language on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const browserLang = navigator.language || navigator.languages?.[0] || "en";
      const detectedLang = browserLang.split("-")[0]; // Get primary language code
      
      setBrowserLanguage(browserLang);
      
      // Check if we need to update the language
      if (detectedLang !== currentLanguage) {
        // The LanguageProvider will handle the language change automatically
        console.log(`[Home] Browser language detected: ${browserLang}, primary: ${detectedLang}`);
      }
    }
  }, [currentLanguage]);

  return (
    <div className="overflow-x-hidden" dir={direction} data-auto-rtl="true">
      <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 lg:p-24">
        {/* Debug Info (only in development) */}
        {/* {process.env.NODE_ENV === "development" && (
          <div className="absolute top-4 left-4 p-3 bg-blue-100 border border-blue-300 rounded-lg text-sm">
            <div><strong>{t('mainPage.debug.currentLanguage')}:</strong> {currentLanguage}</div>
            <div><strong>{t('mainPage.debug.direction')}:</strong> {direction}</div>
            <div><strong>{t('mainPage.debug.rtl')}:</strong> {isRTL ? "Yes" : "No"}</div>
            <div><strong>{t('mainPage.debug.browserLanguage')}:</strong> {browserLanguage}</div>
            <div className="mt-2 pt-2 border-t border-blue-300">
              <div><strong>Widget Header:</strong> {t('widget.header.aiAssistant')}</div>
              <div><strong>Widget Button:</strong> {t('widget.button.open')}</div>
              <div><strong>Widget Input:</strong> {t('widget.input.placeholder')}</div>
            </div>
          </div>
        )} */}

        {/* Translation Test Component
        <TranslationTest /> */}

        {/* Page Title */}
        <h1 className="text-4xl font-bold mb-8">{t('mainPage.title')}</h1>
        <p className="text-xl max-w-2xl text-center mb-8">
          {t('mainPage.description')}
        </p>

        {/* Links Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link
            href="/demo"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('mainPage.buttons.viewDemo')}
          </Link>
          <Link
            href="/docs"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {t('mainPage.buttons.documentation')}
          </Link>
        </div>

        {/* Quick Integration Section */}
        <div className="w-full max-w-3xl p-6 bg-gray-100 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">{t('mainPage.integration.title')}</h2>
          <p className="mb-4">
            {t('mainPage.integration.description')}
          </p>
          <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
            {`<script 
  src="${
    process.env.NEXT_PUBLIC_WIDGET_URL || "https://your-domain.com"
  }/api/widget" 
  id="kogents-chat-widget"
  data-apiToken="your-api-token"
  data-position="right"
  data-color="#3B82F6"
></script>`}
          </pre>
        </div>

        {/* 
        The widget will be loaded via the script in production 
        For development, we load it dynamically after container is available 
      */}
        <div
          id="widget-container"
          className="fixed bottom-6 right-6 z-50"
        ></div>
        <script
          // Dynamically injects the widget script in development
          dangerouslySetInnerHTML={{
            __html: `
            function loadWidgetScript() {
              var container = document.getElementById('widget-container');
              if (!container) {
                // Retry until container is available
                setTimeout(loadWidgetScript, 50);
                return;
              }
              const script = document.createElement('script');
              script.src = '/widget-embed.js?key=${API_KEY}';
              script.id = 'kogents-chat-widget';
              script.setAttribute('data-apiToken', '${API_KEY}');
              script.setAttribute('data-position', 'right');
              script.setAttribute('data-color', '#3B82F6');
              document.body.appendChild(script);
            }
            document.addEventListener('DOMContentLoaded', loadWidgetScript);
          `,
          }}
        />
      </main>
    </div>
  );
}
