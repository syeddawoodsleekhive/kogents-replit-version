import CannedResponseDropdown from "@/components/canned-responses/CannedResponseDropdown";
import { Textarea } from "@/components/ui/textarea";
import EmojiPicker from "../EmojiPicker";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCannedResponses } from "@/hooks/useCannedResponses";
import useNetworkCheck from "@/hooks/useNetworkCheck";
import AttachmentButton from "../AttachmentButton";
import { cn } from "@/lib/utils";
import { useFileCompression } from "@/hooks/useFileCompression";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useClipboard } from "@/hooks/useClipboard";
import CompressionProgressBar from "@/components/ui/CompressionProgressBar";
import DuplicateInfo from "@/components/ui/DuplicateInfo";
import { Upload, X } from "lucide-react";

interface MessageInputProps {
  joinedChat: boolean;
  connected: boolean;
  emitTypingStatus: (roomId: string, typing: boolean) => void;
  roomId: string;
  visitorLeftConfirmJoin: boolean;
  visitorName: string;
  handleJoinRoom: () => void;
  handleContinueChat: () => void;
  confirmClose: boolean;
  sendMessage: (roomId: string, message: string) => void;
  emitSocketEvent?: (event: string, payload: any) => void;
}

const MessageInput = ({
  joinedChat,
  connected,
  emitTypingStatus,
  roomId,
  visitorLeftConfirmJoin,
  visitorName,
  handleJoinRoom,
  handleContinueChat,
  confirmClose,
  sendMessage,
  emitSocketEvent,
}: MessageInputProps) => {
  const { isOffline } = useNetworkCheck();
  const hasManuallySelectedCannedResponse = (index: number) => index !== -1;

  const [message, setMessage] = useState("");
  const [selectedCannedIndex, setSelectedCannedIndex] = useState(-1);
  const [triggerStart, setTriggerStart] = useState(-1);
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  const [cannedResponseQuery, setCannedResponseQuery] = useState("");

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isCompressing,
    compressionProgress,
    duplicateInfo,
    handleFileSelected,
  } = useFileCompression({
    roomId,
    joinedChat,
    connected,
    emitSocketEvent,
  });

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } =
    useDragAndDrop({
      onFileDrop: handleFileSelected,
    });

  useClipboard({
    onFilePaste: handleFileSelected,
    textAreaRef,
  });

  const cannedResponsePosition = useMemo(() => {
    if (!textAreaRef?.current || !showCannedResponses)
      return { top: 0, left: 0 };

    const rect = textAreaRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX,
    };
  }, [showCannedResponses]);

  const { searchResponses } = useCannedResponses();
  const [filteredCannedResponses, setFilteredCannedResponses] = useState<
    CannedResponse[]
  >([]);

  const detectCannedResponseTrigger = useCallback((newMessage: string) => {
    if (newMessage.includes("@@")) {
      const lastAtIndex = newMessage.lastIndexOf("@@");
      if (lastAtIndex >= 0) {
        const query = newMessage.substring(lastAtIndex + 2);
        return {
          type: "category",
          query: query,
          start: lastAtIndex,
          prefix: "@@",
        };
      }
    }

    if (newMessage.includes("::")) {
      const lastColonIndex = newMessage.lastIndexOf("::");
      if (lastColonIndex >= 0) {
        const query = newMessage.substring(lastColonIndex + 2);
        return {
          type: "tag",
          query: query,
          start: lastColonIndex,
          prefix: "::",
        };
      }
    }

    if (newMessage.startsWith("/")) {
      const query = newMessage.substring(1);
      return {
        type: "shortcut",
        query: query,
        start: 0,
        prefix: "/",
      };
    }

    return null;
  }, []);

  const handleMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newMessage = e.target.value;
      setMessage(newMessage);

      if (joinedChat && connected) {
        emitTypingStatus(roomId, newMessage.length > 0);
      }

      if (newMessage === "") {
        setShowCannedResponses(false);
        setCannedResponseQuery("");
        setTriggerStart(-1);
        return;
      }

      const trigger = detectCannedResponseTrigger(newMessage);
      if (trigger) {
        setCannedResponseQuery(trigger.prefix + trigger.query);
        setSelectedCannedIndex(-1);
        setTriggerStart(trigger.start);

        // Get filtered responses based on trigger type
        let filtered: CannedResponse[] = [];

        if (trigger.type === "shortcut") {
          filtered = searchResponses(trigger.query);
        } else if (trigger.type === "category") {
          filtered = searchResponses(trigger.query);
        } else if (trigger.type === "tag") {
          filtered = searchResponses(trigger.query);
        } else {
          filtered = [];
        }

        setFilteredCannedResponses(filtered);
        setShowCannedResponses(filtered.length > 0);
      } else {
        setShowCannedResponses(false);
        setCannedResponseQuery("");
        setTriggerStart(-1);
      }
    },
    [
      detectCannedResponseTrigger,
      searchResponses,
      joinedChat,
      connected,
      emitTypingStatus,
      roomId,
    ]
  );

  const handleCannedResponseSelect = useCallback(
    (response: CannedResponse) => {
      if (triggerStart >= 0) {
        const beforeTrigger = message.substring(0, triggerStart);
        const afterTrigger = message.substring(
          textAreaRef.current?.selectionStart || message.length
        );
        const newMessage = beforeTrigger + response.content + afterTrigger;

        setMessage(newMessage);

        setShowCannedResponses(false);
        setCannedResponseQuery("");
        setTriggerStart(-1);
        setSelectedCannedIndex(-1);

        setTimeout(() => {
          if (textAreaRef.current) {
            const newCursorPosition =
              beforeTrigger.length + response.content.length;
            textAreaRef.current.focus();
            textAreaRef.current.setSelectionRange(
              newCursorPosition,
              newCursorPosition
            );
          }
        }, 0);
      }
    },
    [message, triggerStart]
  );

  const scrollToDropdownItem = useCallback((index: number) => {
    const item = document.getElementById(`canned-response-${index}`);
    const container = document.getElementById("canned-scroll");

    if (!item || !container) return;

    const itemTop = item.offsetTop;
    const itemBottom = itemTop + item.offsetHeight;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;

    if (itemTop < containerTop) {
      container.scrollTop = itemTop;
    } else if (itemBottom > containerBottom) {
      container.scrollTop = itemBottom - container.clientHeight;
    }
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCannedResponses && filteredCannedResponses.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedCannedIndex((prev) => {
          const nextIndex =
            prev < filteredCannedResponses.length - 1 ? prev + 1 : 0;
          scrollToDropdownItem(nextIndex);
          return nextIndex;
        });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedCannedIndex((prev) => {
          const nextIndex =
            prev > 0 ? prev - 1 : filteredCannedResponses.length - 1;
          scrollToDropdownItem(nextIndex);
          return nextIndex;
        });
        return;
      }
      if (
        (e.key === "Enter" || e.key === "Tab") &&
        hasManuallySelectedCannedResponse(selectedCannedIndex)
      ) {
        e.preventDefault();
        handleCannedResponseSelect(
          filteredCannedResponses[selectedCannedIndex]
        );
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowCannedResponses(false);
        setCannedResponseQuery("");
        setTriggerStart(-1);
        setSelectedCannedIndex(-1);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!hasManuallySelectedCannedResponse(selectedCannedIndex)) {
        handleSendMessage();
      }
    }
  };

  const handleSendMessage = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!message.trim()) return;

      if (joinedChat && connected) {
        emitTypingStatus(roomId, false);
      }

      sendMessage(roomId, message);
      setMessage("");
      setShowCannedResponses(false);
    },
    [message, joinedChat, connected, emitTypingStatus, roomId, sendMessage]
  );

  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessage((prevMessage) => prevMessage + emoji);

    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (
        !joinedChat &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        handleJoinRoom();
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [joinedChat, handleJoinRoom]);

  useEffect(() => {
    if (!joinedChat || !connected || message.length === 0) return;

    const timeoutId = setTimeout(() => {
      emitTypingStatus(roomId, false);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [message, joinedChat, connected, roomId, emitTypingStatus]);

  return (
    <div className="border-t border-gray-200 bg-white px-2 pt-2 pb-1 chat-area">
      <CompressionProgressBar
        isCompressing={isCompressing}
        compressionProgress={compressionProgress}
      />

      <DuplicateInfo duplicateInfo={duplicateInfo} />

      {joinedChat && !visitorLeftConfirmJoin && !isOffline ? (
        <form
          onSubmit={handleSendMessage}
          className={cn(
            "flex flex-col gap-1 transition-all duration-200"
            // isDragging && "ring-2 ring-blue-500 ring-opacity-50 rounded-lg"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="relative">
            <Textarea
              ref={textAreaRef}
              autoFocus
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyPress}
              placeholder="Type a message and press Enter to send..."
              className={cn(
                "min-h-[146px] max-h-[146px] resize-none border rounded-lg bg-gray-50 text-base p-3 focus:ring-2 focus:ring-[#1F73B7] focus:border-[#1F73B7]",
                isDragging && "border-blue-500 ring-2 ring-blue-500"
              )}
              disabled={!connected || !joinedChat || isCompressing}
            />

            {isDragging && (
              <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10">
                <div className="text-blue-700 text-lg font-medium">
                  Drop files here to upload
                </div>
              </div>
            )}

            {showCannedResponses && !confirmClose && (
              <CannedResponseDropdown
                responses={filteredCannedResponses}
                selectedIndex={selectedCannedIndex}
                onSelect={handleCannedResponseSelect}
                position={cannedResponsePosition}
                visible={showCannedResponses}
                cannedResponseQuery={cannedResponseQuery}
              />
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AttachmentButton
                onFileSelected={handleFileSelected}
                disabled={!connected || !joinedChat || isCompressing}
              />
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                disabled={!connected || !joinedChat || isCompressing}
              />

              <span className="text-xs text-gray-500 ml-1">
                Shift+Enter for new line, Enter to send
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {message.length > 0 ? `${message.length} characters` : ""}
            </div>
          </div>
        </form>
      ) : (
        <div
          onClick={
            !(visitorLeftConfirmJoin || isOffline) ? handleJoinRoom : undefined
          }
          className="flex flex-col gap-2 h-[176px] items-center justify-center text-sm text-gray-500"
        >
          {isOffline ? (
            <p>You're offline. Please check your network connection.</p>
          ) : visitorLeftConfirmJoin ? (
            <div className="flex gap-2 items-center">
              <p>{visitorName} has left the chat.</p>
              {joinedChat && (
                <Button
                  className="px-3 h-8 text-xs bg-white text-black border hover:bg-gray-100"
                  onClick={handleContinueChat}
                >
                  Continue chat
                </Button>
              )}
            </div>
          ) : (
            <p>You're viewing this chat. Start typing to join the chat.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageInput;
