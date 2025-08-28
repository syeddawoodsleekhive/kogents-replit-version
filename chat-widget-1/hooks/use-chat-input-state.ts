// hooks/useChatInputState.ts
"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { FileUploadType } from "@/components/file-upload";

export function useChatInputState(
  onSendMessage: (message: string, files?: File[]) => void,
  toggleChatOpen: boolean,
  onTypingChange?: (isTyping: boolean) => void
) {
  const InputFocus = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiShortcutSuggestions, setEmojiShortcutSuggestions] = useState<
    { shortcut: string; emoji: string }[]
  >([]);
  const [pendingFiles, setPendingFiles] = useState<FileUploadType[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus when chat opens
  useEffect(() => {
    if (toggleChatOpen) InputFocus.current?.focus();
  }, [toggleChatOpen]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  /** Send message & files */
  const handleSendMessage = useCallback(() => {
    if (pendingFiles.length === 0 && !message.trim()) return;

    // Get a snapshot of current state to avoid race conditions
    const currentMessage = message.trim();
    const currentFiles = [...pendingFiles];
    
    if (currentFiles.length === 0 && !currentMessage) return;

    const completedFiles = currentFiles
      .filter((file) => file.status === "complete")
      .map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        blob: file.file,
        previewUrl: file.previewUrl,
      }));

    const nativeFiles = completedFiles.length
      ? completedFiles.map(
          (file) =>
            new File([file.blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
        )
      : undefined;

    onSendMessage(currentMessage, nativeFiles);

    // Reset state immediately to prevent interference
    setMessage("");
    setPendingFiles([]);
    setShowFileUpload(false);
    
    // Stop typing indicator
    setIsTyping(false);
    onTypingChange?.(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Re-focus input with a small delay to ensure state updates are processed
    setTimeout(() => InputFocus.current?.focus(), 50);
  }, [message, pendingFiles, onSendMessage]);

  /** Form submit */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage && pendingFiles.length === 0) return;
    handleSendMessage();
  };

  /** Handle typing state */
  const handleTypingState = useCallback((value: string) => {
    const hasContent = value.trim().length > 0;
    
    if (hasContent && !isTyping) {
      setIsTyping(true);
      onTypingChange?.(true);
    } else if (!hasContent && isTyping) {
      setIsTyping(false);
      onTypingChange?.(false);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator after user stops typing
    if (hasContent) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTypingChange?.(false);
      }, 2000); // Stop typing indicator after 2 seconds of inactivity
    }
  }, [isTyping, onTypingChange]);

  /** Input change */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Update typing state
    handleTypingState(value);

    const lastWord = value.split(/\s/).pop() || "";

    if (
      emojiShortcutSuggestions.length === 1 &&
      emojiShortcutSuggestions[0].shortcut === lastWord
    ) {
      const { shortcut, emoji } = emojiShortcutSuggestions[0];
      setMessage(value.replace(new RegExp(`${shortcut}$`), emoji));
      setEmojiShortcutSuggestions([]);
    }
  };

  /** Key handling */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage();
    }
  };

  /** Emoji handling */
  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  /** File handling */
  const handleFileSelect = (files: FileUploadType[]) => {
    setPendingFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      files.forEach((newFile) => {
        const idx = updatedFiles.findIndex((f) => f.id === newFile.id);
        if (idx >= 0) {
          // Only update if the file status has changed to avoid unnecessary re-renders
          if (updatedFiles[idx].status !== newFile.status || updatedFiles[idx].progress !== newFile.progress) {
            updatedFiles[idx] = newFile;
          }
        } else {
          updatedFiles.push(newFile);
        }
      });
      return updatedFiles;
    });
  };
  const handleCancelFile = (fileId: string) =>
    setPendingFiles((prev) => prev.filter((file) => file.id !== fileId));

  return {
    InputFocus,
    message,
    setMessage,
    showEmojiPicker,
    setShowEmojiPicker,
    emojiShortcutSuggestions,
    setEmojiShortcutSuggestions,
    pendingFiles,
    setPendingFiles,
    showFileUpload,
    setShowFileUpload,
    isTyping,
    handleSubmit,
    handleSendMessage,
    handleInputChange,
    handleKeyDown,
    handleEmojiSelect,
    handleFileSelect,
    handleCancelFile,
  };
}
