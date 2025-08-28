"use client";

import { WidgetAppearanceModel } from "@/types/appearance";
import ChatHeader from "../chat-header";
import ChatInput from "../chat-input";
import { cn } from "@/lib/utils";

interface BadgeChatFormProps {
  settings: WidgetAppearanceModel | null;
  headerOptions: any;
  chatInputOptions: any;
  isOpen: boolean;
  isChatBadge: boolean;
  messages?: unknown[]; // Kept for future use (documented as unused)
  isBadgeChatEnabled: boolean;
}

export default function BadgeChatForm({
  settings,
  isOpen,
  headerOptions,
  chatInputOptions,
  isChatBadge,
  isBadgeChatEnabled,
}: BadgeChatFormProps) {
  return (
    <div
      className={cn(
        "bg-white shadow-lg flex flex-col relative transition-opacity duration-200",
        isOpen
          ? "opacity-100 w-[calc(100vw-8rem)]"
          : "opacity-0 pointer-events-none"
      )}
      aria-hidden={!isOpen}
      style={{
        borderRadius: settings?.appearance?.borderRadius ?? 12,
      }}
    >
      {/* Chat Header */}
      <ChatHeader {...headerOptions} isChatBadge={isChatBadge} />

      <div className="bg-white content-center">
        <img
          src="/hello-new.gif"
          className="w-[180px] h-[120px] mx-auto"
          alt="Hello illustration"
        />
      </div>

      {/* Chat Input */}
      <div className="p-2">
        <ChatInput {...chatInputOptions} isChatBadge />
      </div>
    </div>
  );
}
