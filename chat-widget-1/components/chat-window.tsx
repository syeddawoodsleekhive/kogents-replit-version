"use client";

import { useWidgetContext } from "@/context/widgetContext";
import { useChatWindowOptions } from "@/hooks/use-chat-window-options";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLanguage } from "@/context/language-context";
import BadgeChatForm from "./forms/badge-chat-form";
import OfflineChatForm from "./forms/offline-chat-form";
import PostChatForm from "./forms/post-chat-form";
import PreChatForm from "./forms/pre-chat-form";
import UserInfoChatForm from "./forms/userInfo-chat-form";
import MessageList from "./message-list";

// ------------------ Schema & Defaults ------------------
const preChatSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  message: z.string().optional(),
});
type PreChatFormValues = z.infer<typeof preChatSchema>;
const defaultPreChatValues: PreChatFormValues = {
  name: "",
  email: "",
  message: "",
};

// ------------------ Helpers ------------------
const readLocalStorage = (key: string, fallback = false): boolean => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};
const writeLocalStorage = (key: string, value: boolean) =>
  localStorage.setItem(key, JSON.stringify(value));

export type IUploadImageProps = {
  name: string;
  type: string;
  url: string;
  size: number;
}[];

export default function ChatWindow({
  isOpen,
  toggleChatOpen,
  wsStatus,
  messages,
  isAgentOnline,
  onClose,
  onSendMessage,
  onDownloadTranscript,
  onReconnect,
  onTyping,
  isFullScreen = false,
  toggleFullScreen,
  roomId,
  workspaceId, // Currently unused
  agentData,
  isBadgeChatEnabled,
  socketStatus,
  showConnectedMessage,
  emitSocketEvent,
}: ChatWindowProps) {
  const [isUserTyping, setIsUserTyping] = useState(false);
  const { widgetSettings } = useWidgetContext();
  const { isRTL, direction } = useLanguage();

  const {
    register, // reserved for forms
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PreChatFormValues>({
    resolver: zodResolver(preChatSchema),
    defaultValues: defaultPreChatValues,
  });

  // Derived states
  // const isTagEnable = useMemo(() => messages.length < 5, [messages]);

  const isPreChatEnabled = widgetSettings?.forms?.preChatForm?.enabled || false;
  const isOfflineFormEnabled =
    widgetSettings?.forms?.offlineChatForm?.enabled || false;
  const isUserInfoEnabled =
    widgetSettings?.forms?.userInfoForm?.enabled || false;
  const isPostChatEnabled =
    widgetSettings?.forms?.postChatForm?.enabled || false;

  // LocalStorage flags
  const [storedBadgeFlag, setStoredBadgeFlag] = useState<boolean>(() =>
    readLocalStorage("user_first_message")
  );
  const [storedPreFlag, setStoredPreFlag] = useState<boolean>(() =>
    readLocalStorage("is_pre_chat_closed")
  );
  const [storedPostFlag, setStoredPostFlag] = useState<boolean>(() =>
    readLocalStorage("is_post_chat_closed")
  );
  // Persist badge flag when user sends a message
  useEffect(() => {
    const userHasSentMessage = messages?.some(
      (msg) => msg.senderType === "visitor" && msg.content?.trim()
    );

    if (userHasSentMessage && !storedBadgeFlag) {
      writeLocalStorage("user_first_message", true);
      setStoredBadgeFlag(true);
    }
  }, [messages, storedBadgeFlag]);

  const isTagEnable = useMemo(() => {
    const userMsgs = messages.filter((msg) => msg.senderType === "visitor");
    const agentMsgs = messages.filter((msg) => msg.senderType === "agent");
    const liveAgentMsgs = messages.filter(
      (msg) => msg.senderType === "ai-agent"
    );
    if (
      agentMsgs.length >= 3 ||
      liveAgentMsgs.length >= 2 ||
      userMsgs.length > 0 ||
      messages.length >= 5
    ) {
      return false;
    }
  }, [messages, storedBadgeFlag]);

  // Reset prechat flag when widget settings change
  useEffect(() => {
    if (!storedPreFlag) {
      writeLocalStorage("is_pre_chat_closed", false);
      setStoredPreFlag(false);
    }
  }, [widgetSettings, storedPreFlag]);

  const handleClosePreChatForm = () => {
    writeLocalStorage("is_pre_chat_closed", true);
    setStoredPreFlag(true);
  };

  const handleClosePostChatForm = () => {
    writeLocalStorage("is_post_chat_closed", true);
    setStoredPostFlag(true);
  };

  // Options via custom hook
  const { headerOptions, chatInputOptions, showUserInfo, handleUserInfo } =
    useChatWindowOptions({
      wsStatus,
      isAgentOnline,
      onClose,
      onDownloadTranscript,
      onReconnect,
      isFullScreen,
      messages,
      toggleFullScreen,
      roomId,
      agentData,
      toggleChatOpen,
      isOpen,
      onSendMessage,
      isTagEnable: isTagEnable || false,
    });

  return (
    <>
      {isOfflineFormEnabled ? (
        <OfflineChatForm
          headerOptions={headerOptions}
          settings={widgetSettings}
          isFullScreen={isFullScreen}
          isOpen={isOpen}
        />
      ) : !storedBadgeFlag && isBadgeChatEnabled ? (
        <BadgeChatForm
          headerOptions={headerOptions}
          chatInputOptions={chatInputOptions}
          isOpen={isOpen}
          settings={widgetSettings}
          messages={messages}
          isChatBadge={isBadgeChatEnabled}
          isBadgeChatEnabled={isBadgeChatEnabled}
        />
      ) : !storedPreFlag &&
        isPreChatEnabled &&
        storedBadgeFlag &&
        !storedPostFlag ? (
        <PreChatForm
          headerOptions={headerOptions}
          settings={widgetSettings}
          chatInputOptions={chatInputOptions}
          isOpen={isOpen}
          isFullScreen={isFullScreen}
          onClose={handleClosePreChatForm}
        />
      ) : !storedPostFlag && isPostChatEnabled && storedBadgeFlag ? (
        <PostChatForm
          headerOptions={headerOptions}
          settings={widgetSettings}
          isOpen={isOpen}
          isFullScreen={isFullScreen}
          onClose={handleClosePostChatForm}
        />
      ) : (
        <MessageList
          userInfoPopup={
            showUserInfo &&
            isUserInfoEnabled && (
              <UserInfoChatForm
                settings={widgetSettings}
                onClose={handleUserInfo}
              />
            )
          }
          headerOptions={headerOptions}
          settings={widgetSettings}
          chatInputOptions={{
            ...chatInputOptions,
            onTypingChange: setIsUserTyping,
          }}
          isOpen={isOpen}
          isFullScreen={isFullScreen}
          onTyping={onTyping}
          onSendMessage={onSendMessage}
          socketStatus={socketStatus}
          showConnectedMessage={showConnectedMessage}
          emitSocketEvent={emitSocketEvent}
        />
      )}
    </>
  );
}
