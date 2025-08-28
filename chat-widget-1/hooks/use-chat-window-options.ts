"use client";

import { useState, useCallback } from "react";
import type {  WebSocketStatus } from "@/types/chat";

interface UseChatWindowOptionsParams {
  wsStatus: WebSocketStatus;
  isAgentOnline: boolean;
  onClose: () => void;
  onDownloadTranscript: () => void;
  onReconnect?: () => void;
  isFullScreen: boolean;
  messages: MessagesType[];
  toggleFullScreen: () => void;
  roomId: string;
  agentData: any;
  toggleChatOpen?: boolean;
  isOpen: boolean;
  onSendMessage: (msg: string) => void;
  isTagEnable: boolean;
}

export function useChatWindowOptions({
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
  isTagEnable,
}: UseChatWindowOptionsParams) {
  const [showUserInfo, setShowUserInfo] = useState(false);
  const handleUserInfo = useCallback(() => setShowUserInfo((prev) => !prev), []);

  const headerOptions = {
    wsStatus,
    isOnline: isAgentOnline,
    onClose,
    onDownloadTranscript,
    onReconnect,
    isFullScreen,
    messages,
    toggleFullScreen,
    roomId,
    agentData,
  };

  const chatInputOptions = {
    toggleChatOpen,
    isOpen,
    messages,
    onSendMessage,
    isTagEnable,
    onClick: handleUserInfo,
  };

  return { headerOptions, chatInputOptions, showUserInfo, handleUserInfo };
}
