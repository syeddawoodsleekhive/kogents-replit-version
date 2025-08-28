import { MessageStatusIcon, SystemMessageUI } from "@/components/common";
import { renderMarkdown } from "@/functions";
import { formatTime } from "@/functions/index-v2";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import FileAttachment from "./FileAttachments";
import { useMessageEncryption } from "@/hooks/use-message-encryption";

const ChatMessageItem = React.memo(
  ({
    msg,
    index,
    visitorName,
    sameUser,
  }: {
    msg: MessageType;
    index: number;
    visitorName: string;
    sameUser: boolean;
  }) => {
    const [sessionId, setSessionId] = useState("");
    const [isDecrypted, setIsDecrypted] = useState(false);
    const [decryptedContent, setDecryptedContent] = useState(msg.content);

    // Initialize encryption session
    useEffect(() => {
      setSessionId(`widget_${Date.now()}`);
    }, []);

    const { decryptMessage } = useMessageEncryption(sessionId);

    // Check if message is encrypted and decrypt if needed (silently, no UI indicators)
    useEffect(() => {
      if (msg.metadata?.encryptedMessage && !isDecrypted) {
        const decryptContent = async () => {
          try {
            const decrypted = await decryptMessage(
              msg.metadata.encryptedMessage
            );
            setDecryptedContent(decrypted);
            setIsDecrypted(true);
            console.log("[v0] Message decrypted successfully");
          } catch (error) {
            console.error("[v0] Message decryption failed:", error);
            setDecryptedContent(msg.content); // Fallback to original content
          }
        };
        decryptContent();
      }
    }, [msg, decryptMessage, isDecrypted]);

    if (
      msg.senderType === "visitor-system" ||
      msg.senderType === "agent-system"
    ) {
      return (
        <SystemMessageUI
          msg={msg.content}
          messageType={msg.messageType}
          createdAt={msg.sentAt || msg.createdAt}
          link={msg.pageUrl}
        />
      );
    }

    return (
      <div
        className={cn(
          "px-6 py-2",
          index > 0 && "border-b border-dashed messageItem"
        )}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="font-medium text-sm">
            {msg.senderType === "visitor" ? visitorName : msg.senderName}
          </span>
          <span className="text-xs text-gray-400 font-light">
            {formatTime(msg.sentAt || msg.createdAt)}
          </span>
        </div>

        {decryptedContent && (
          <div
            className="flex flex-col whitespace-pre-wrap text-sm mb-1 break-all message-item"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(decryptedContent),
            }}
          ></div>
        )}

        {msg.metadata?.attachment ? <FileAttachment msg={msg} /> : null}

        {msg.senderType === "agent" && sameUser && (
          <div className="flex justify-end mt-1">
            <MessageStatusIcon msg={msg} />
          </div>
        )}
      </div>
    );
  }
);

ChatMessageItem.displayName = "MessageItem";

export default ChatMessageItem;
