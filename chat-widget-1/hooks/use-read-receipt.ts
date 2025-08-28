import { useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useWindowFocus } from "@/hooks/use-window-focus";

interface UseReadReceiptProps {
  isOpen: boolean;
  sessionId: string;
  onSendReadReceipt: (payload: {
    roomId: string;
    messages: Array<{ messageId: string; senderId: string }>;
  }) => void;
}

export function useReadReceipt({
  isOpen,
  sessionId,
  onSendReadReceipt,
}: UseReadReceiptProps) {
  const messages = useSelector(
    (state: RootReducerState) => state.chat.messages
  );
  const { isFocused } = useWindowFocus();

  const readReceiptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<number>(0);

  const getUnreadAgentMessages = useCallback(() => {
    return messages.filter(
      (msg) =>
        (msg.senderType === "agent" || msg.senderType === "ai-agent") &&
        !msg.readAt
    );
  }, [messages]);

  const sendReadReceipt = useCallback(() => {
    const unreadMessages = getUnreadAgentMessages();

    if (unreadMessages.length === 0) return;

    const messageReads = unreadMessages.map((msg) => ({
      messageId: msg.messageId,
      senderId: msg.userId || msg.senderId,
    }));

    const roomId = unreadMessages[0].roomId || sessionId;

    onSendReadReceipt({
      roomId,
      messages: messageReads,
    });

    console.log("Sent read receipt for messages:", messageReads);
  }, [getUnreadAgentMessages, onSendReadReceipt, sessionId]);

  const sendReadReceiptDebounced = useCallback(() => {
    if (readReceiptTimeoutRef.current) {
      clearTimeout(readReceiptTimeoutRef.current);
    }

    readReceiptTimeoutRef.current = setTimeout(() => {
      sendReadReceipt();
    }, 500);
  }, [sendReadReceipt]);

  useEffect(() => {
    const currentMessageCount = messages.length;
    const hasNewMessages = currentMessageCount > lastMessageCountRef.current;

    if (hasNewMessages && isOpen && isFocused) {
      sendReadReceipt();
    }

    lastMessageCountRef.current = currentMessageCount;
  }, [messages, isOpen, isFocused, sendReadReceipt]);

  const shouldSendReadReceipt = useCallback(() => {
    return isOpen && isFocused && getUnreadAgentMessages().length > 0;
  }, [isOpen, isFocused, getUnreadAgentMessages]);

  useEffect(() => {
    if (shouldSendReadReceipt()) {
      sendReadReceiptDebounced();
    } else {
      if (readReceiptTimeoutRef.current) {
        clearTimeout(readReceiptTimeoutRef.current);
        readReceiptTimeoutRef.current = null;
      }
    }
  }, [shouldSendReadReceipt, sendReadReceiptDebounced]);

  useEffect(() => {
    return () => {
      if (readReceiptTimeoutRef.current) {
        clearTimeout(readReceiptTimeoutRef.current);
      }
    };
  }, []);

  return {
    sendReadReceipt,
    getUnreadAgentMessages,
  };
}
