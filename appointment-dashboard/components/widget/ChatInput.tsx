"use client";
import { WidgetChatInputProps } from "@/types/widget";
import { Send } from "lucide-react";
import { FormEvent, useMemo, useState, useEffect } from "react";
import AttachmentButton from "../visitor/AttachmentButton";
import { useMessageEncryption } from "@/hooks/use-message-encryption";

export default function ChatInput({
  hidePoweredBy,
  message,
  setMessage,
  settings,
  fontSize,
  fontFamily,
  onContentUpdate,
  handleAttachmentSelect,
}: WidgetChatInputProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId, setSessionId] = useState("");

  // Initialize encryption with a unique session ID
  useEffect(() => {
    setSessionId(`widget_${Date.now()}`);
  }, []);

  const { encryptMessage } = useMessageEncryption(sessionId);

  // Debug encryption hook initialization
  useEffect(() => {
    console.log("[v0] 🔍 ChatInput: Encryption hook initialized");
    console.log("[v0] 🔍 ChatInput: Session ID:", sessionId);
    console.log("[v0] 🔍 ChatInput: encryptMessage function:", typeof encryptMessage);
    
    // Test if Web Crypto API is available
    if (window.crypto && window.crypto.subtle) {
      console.log("[v0] ✅ Web Crypto API is available");
    } else {
      console.error("[v0] ❌ Web Crypto API not available");
    }
  }, [sessionId, encryptMessage]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    try {
      console.log("[v0] 🔐 Starting message encryption...");
      console.log("[v0] 🔐 Session ID:", sessionId);
      console.log("[v0] 🔐 Message to encrypt:", inputMessage.trim());
      console.log("[v0] 🔐 Encryption hook initialized:", !!encryptMessage);
      
      if (!sessionId) {
        console.error("[v0] ❌ No session ID available");
        return;
      }
      
      // Encrypt the message before sending (silently, no UI indicators)
      console.log("[v0] 🔐 Calling encryptMessage function...");
      const encryptedMessage = await encryptMessage(inputMessage.trim());
      console.log("[v0] 🔐 Encryption result received:", encryptedMessage);
      
      // Create message object with encryption metadata
      const messageWithEncryption = {
        content: inputMessage.trim(),
        metadata: {
          encryptedMessage: encryptedMessage,
          isEncrypted: true,
          encryptionTimestamp: Date.now()
        }
      };
      
      // Add encrypted message to the chat
      setMessage((prev) => [...prev, messageWithEncryption]);
      setInputMessage("");
      
      console.log("[v0] ✅ Message encrypted and sent successfully");
    } catch (error) {
      console.error("[v0] ❌ Message encryption failed:", error);
      console.error("[v0] ❌ Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        sessionId,
        inputMessage: inputMessage.trim()
      });
      // Fallback to plain text if encryption fails
      setMessage((prev) => [...prev, inputMessage.trim()]);
      setInputMessage("");
    }
  };

  const primaryColor = useMemo(
    () => settings.appearance.primaryColor,
    [settings.appearance.primaryColor]
  );
  const secondaryColor = useMemo(
    () => settings.appearance.secondaryColor,
    [settings.appearance.secondaryColor]
  );

  const textColor = useMemo(
    () => settings.appearance.textColor,
    [settings.appearance.textColor]
  );

  return (
    <div
      className="relative border-t bg-white rounded-b-lg"
      style={{ fontFamily }}
    >
      {hidePoweredBy &&
        !inputMessage &&
        settings.content.formType !== "chat-badge" && (
          <div
            // className="absolute top-[calc(100%+0.5rem)] left-[50%] -translate-x-1/2 text-[0.6875rem] leading-none pt-1 pb-1.5 px-3 text-center shadow-lg rounded-md"
            className="absolute bottom-[calc(100%+0.5rem)] left-[50%] -translate-x-1/2 text-[0.6875rem] leading-none pt-1 pb-1.5 px-3 text-center"
            style={{
              color: primaryColor,
              fontFamily,
            }}
          >
            Powered by Kogents
          </div>
        )}
      {hidePoweredBy &&
        inputMessage &&
        settings.content.userInfoForm.enabled &&
        !settings.content.userInfoForm.showUserInfoForm && (
          <div
            // className="absolute top-[calc(100%+0.5rem)] left-[50%] -translate-x-1/2 text-[0.6875rem] leading-none pt-1 pb-1.5 px-3 text-center shadow-lg rounded-md"
            className="absolute text-blue-700 font-medium underline cursor-pointer bottom-[calc(100%+0.5rem)] left-[50%] -translate-x-1/2 text-xs leading-none pt-1 pb-1.5 px-3 text-center"
            style={{
              // color: primaryColor,
              fontFamily,
            }}
            onClick={() => {
              if (onContentUpdate) {
                onContentUpdate({
                  userInfoForm: {
                    ...settings.content.userInfoForm,
                    showUserInfoForm: true,
                  },
                });
              }
            }}
          >
            Please update your info
          </div>
        )}
      <form onSubmit={handleSubmit} className="flex items-center p-3 font-sans">
        <input
          type="text"
          value={inputMessage}
          id="chat-message-input"
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          autoComplete="off"
          className="flex-1 border-none outline-none px-3 py-2 text-sm"
          style={{ color: textColor, fontSize, fontFamily }}
        />
        <div className="flex items-center">
          {/* {message.length == 0 && (
            <AttachmentButton
              onFileSelected={handleAttachmentSelect as (file: File) => void}
            />
          )} */}
          <button
            type="submit"
            id="chat-message-submit"
            disabled={!inputMessage.trim()}
            className={`p-2 rounded-full`}
            aria-label="Send message"
            style={{
              color: inputMessage.trim() ? primaryColor : "#d1d5db",
            }}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
