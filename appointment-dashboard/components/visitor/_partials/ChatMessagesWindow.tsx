import { SystemMessageUI } from "@/components/common";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ChatMessageItem from "./ChatMessageItem";
import NewMessageBadge from "./NewMessageBadge";
import { useMessageEncryption } from "@/hooks/use-message-encryption";
import { useFileEncryption } from "@/hooks/use-file-encryption";
import { useSelector } from "react-redux";

interface ChatMessagesProps {
  currentMessages: MessageType[];
  visitorName: string;
  isTyping: boolean;
  visitorPath: PageTrackingType[];
}

const ChatMessagesWindow = ({
  currentMessages,
  visitorName,
  isTyping,
  visitorPath,
}: ChatMessagesProps) => {
  const currentChatScrollRef = useRef<HTMLDivElement>(null);
  const [showNewMessageBadge, setShowNewMessageBadge] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [sessionId, setSessionId] = useState("");

  const user = useSelector((state: RootReducerState) => state.user.user);

  // Initialize encryption session
  useEffect(() => {
    setSessionId(`widget_${Date.now()}`);
  }, []);

  // Initialize encryption hooks for background monitoring
  const { getStats: getMessageEncryptionStats } =
    useMessageEncryption(sessionId);
  const { getStats: getFileEncryptionStats } = useFileEncryption(sessionId);

  // Log encryption statistics periodically (background logging only)
  useEffect(() => {
    const interval = setInterval(() => {
      const messageStats = getMessageEncryptionStats();
      const fileStats = getFileEncryptionStats();

      if (
        messageStats.encryption.completed > 0 ||
        fileStats.encryption.completed > 0
      ) {
        console.log("[v0] Encryption Statistics", {
          messageEncryption: messageStats,
          fileEncryption: fileStats,
          sessionId,
        });
      }
    }, 10000); // Log every 10 seconds

    return () => clearInterval(interval);
  }, [getMessageEncryptionStats, getFileEncryptionStats, sessionId]);

  const pageTrackingMessages: MessageType[] = useMemo(() => {
    return visitorPath.map((vp) => ({
      roomId: "",
      senderId: "",
      messageId: vp.pageHash,
      messageType: "page-tracking",
      createdAt: vp.viewedAt,
      content: vp.pageTitle,
      senderType: "visitor-system",
      pageUrl: vp.pageUrl,
    }));
  }, [visitorPath]);

  const allMessages: MessageType[] = useMemo(() => {
    const messages = [...currentMessages, ...pageTrackingMessages].sort(
      (a, b) =>
        new Date(a.sentAt || a.createdAt).getTime() -
        new Date(b.sentAt || b.createdAt).getTime()
    );

    return messages;
  }, [currentMessages, pageTrackingMessages]);

  const checkIfNearBottom = useCallback(() => {
    if (!currentChatScrollRef.current) return false;

    const scrollElement = currentChatScrollRef.current;
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const threshold = 100;

    return scrollHeight - scrollTop - clientHeight < threshold;
  }, []);

  const handleScroll = useCallback(() => {
    const nearBottom = checkIfNearBottom();
    setIsNearBottom(nearBottom);

    if (nearBottom) {
      setShowNewMessageBadge(false);
    }
  }, [checkIfNearBottom]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      if (currentChatScrollRef.current) {
        const scrollElement = currentChatScrollRef.current;
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior,
        });

        if (newMessageCount > 0) {
          setNewMessageCount(0);
        }
        setShowNewMessageBadge(false);
      }
    },
    [newMessageCount]
  );

  useEffect(() => {
    // if (isTyping) return;
    const currentMessageCount = allMessages.length;
    const hasNewMessages = currentMessageCount > lastMessageCount;
    const lastMessage = allMessages[allMessages.length - 1];
    const isLastMessageFromUser = lastMessage.senderId === user?.id;

    if (hasNewMessages) {
      if (isNearBottom || isLastMessageFromUser) {
        scrollToBottom();
      } else {
        setShowNewMessageBadge(true);
        setNewMessageCount(
          (prev) => prev + (currentMessageCount - lastMessageCount)
        );
      }
    }

    setLastMessageCount(currentMessageCount);
  }, [
    allMessages.length,
    user,
    isNearBottom,
    lastMessageCount,
    scrollToBottom,
    isTyping,
  ]);

  useEffect(() => {
    if (isTyping && isNearBottom) {
      scrollToBottom();
    }
  }, [isTyping, isNearBottom, scrollToBottom]);

  useEffect(() => {
    const scrollElement = currentChatScrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    scrollToBottom("instant");
  }, []);

  return (
    <div className="flex-1 overflow-hidden flex flex-col relative">
      <div
        ref={currentChatScrollRef}
        data-chat-window
        className="flex-1 overflow-y-auto scrollbar-thin pb-2"
      >
        {allMessages.length > 0 ? (
          <div className="space-y-0">
            {allMessages.map((msg, index) => (
              <ChatMessageItem
                msg={msg}
                key={msg.messageId || index}
                index={index}
                visitorName={visitorName}
                sameUser={msg.senderId === user?.id}
              />
            ))}

            {isTyping && (
              <SystemMessageUI msg={`${visitorName} is typing...`} />
            )}
          </div>
        ) : (
          <SystemMessageUI msg="No chat activity for a while" />
        )}
      </div>

      {showNewMessageBadge && (
        <NewMessageBadge
          onClick={() => scrollToBottom()}
          messageCount={newMessageCount}
        />
      )}
    </div>
  );
};

export default ChatMessagesWindow;
