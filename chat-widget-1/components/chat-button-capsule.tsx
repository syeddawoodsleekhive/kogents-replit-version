"use client";

import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetContext } from "@/context/widgetContext";
import { useState, useRef, useEffect } from "react";
import { useLiveAnnouncement } from "@/hooks/use-live-announcement";
import { useT } from "@/lib/i18n";
import { useLanguage } from "@/context/language-context";

interface ChatButtonProps {
  isOpen: boolean;
  unreadCount: number;
  onClick: () => void;
  disabled?: boolean;
}

export default function ChatButtonCapsule({
  isOpen,
  unreadCount,
  onClick,
  disabled = false,
}: ChatButtonProps) {
  const { widgetSettings } = useWidgetContext();
  const t = useT();
  const { isRTL, direction } = useLanguage();
  const showBadge = !isOpen && unreadCount > 0;

  const [ariaLabel, setAriaLabel] = useState(
    isOpen ? t('widget.button.close') : t('widget.button.open')
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Accessibility: live announcements
  const { liveRegionRef, announce, announcement } = useLiveAnnouncement(1200);

  // Sync ARIA label when chat state changes
  useEffect(() => {
    setAriaLabel(isOpen ? t('widget.button.close') : t('widget.button.open'));
    announce(isOpen ? t('widget.accessibility.chatClosed') : t('widget.accessibility.chatOpened'));

    // Move focus to button when state changes
    if (buttonRef.current) buttonRef.current.focus();
  }, [isOpen, t]);

  // Announce unread messages badge
  useEffect(() => {
    if (showBadge) {
      announce(`${unreadCount} ${t('widget.accessibility.unreadMessage')}`);
    }
  }, [unreadCount, showBadge, announce, t]);

  // Announce disabled state
  useEffect(() => {
    announce(disabled ? t('widget.accessibility.chatButtonDisabled') : t('widget.accessibility.chatButtonEnabled'));
  }, [disabled, announce, t]);

  // Update tab index based on disabled state
  useEffect(() => {
    if (buttonRef.current) buttonRef.current.tabIndex = disabled ? -1 : 0;
  }, [disabled]);

  return (
    <>
      {/* Live region for announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        style={{
          position: "absolute",
          left: "-9999px",
          height: "1px",
          width: "1px",
          overflow: "hidden",
        }}
      >
        {announcement}
      </div>

      {/* Chat button */}
      <button
        ref={buttonRef}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center rounded-3xl px-4 py-2 shadow-lg transition-all duration-300 relative chat-button-capsule motion-reduce animation-optimize",
          isOpen
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-500 hover:bg-blue-600"
        )}
        id="chat-toggle-button"
        aria-label={ariaLabel}
        aria-disabled={disabled}
        aria-pressed={isOpen}
        tabIndex={disabled ? -1 : 0}
        style={{
          // backgroundColor: widgetSettings?.appearance.colors.primary,
          backgroundColor: "#3b82f6",
          willChange: "background-color, opacity",
        }}
        dir={direction}
        data-rtl={isRTL}
        onFocus={() => {
          announce(
            isOpen
              ? `${t('widget.accessibility.chatButtonFocused')}, ${t('widget.accessibility.closeChat')}`
              : `${t('widget.accessibility.chatButtonFocused')}, ${t('widget.accessibility.openChat')}`
          );
        }}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <div className={cn(
            "flex items-center justify-center gap-1",
            isRTL ? "flex-row-reverse" : ""
          )}>
            {/* <img src="/chat-icon.svg" className="w-[36px]" /> */}
            <MessageCircle className="w-[20px] text-white" />
            <span className="text-white text-sm font-medium">{t('widget.button.chat')}</span>
          </div>
        )}

        {showBadge && (
          <span
            className={cn(
              "absolute -top-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center motion-reduce animation-optimize",
              isRTL ? "-left-1" : "-right-1"
            )}
            aria-label={`${unreadCount} ${t('widget.accessibility.unreadMessage')}`}
            role="status"
            style={{ willChange: "opacity" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
