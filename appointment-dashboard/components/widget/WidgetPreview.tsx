"use client";

import HeaderIcon from "@/components/HeaderIcon";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WidgetPreviewProps } from "@/types/widget";
import {
  Check,
  Maximize,
  MessageSquare,
  Minus,
  Paperclip,
  Volume2,
  VolumeX,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import ChatInput from "./ChatInput";
import MessageItem from "./MessageItem";
import PostChatForm from "./forms/PostChatForm";
import PreChatForm from "./forms/PreChatForm";
import OfflineChatForm from "./forms/OfflineChatForm";
import { Button } from "../ui/button";

export function WidgetPreview({
  settings,
  onSoundUpdate,
  onContentUpdate,
  isMinimized = false,
}: WidgetPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  type ImageProps = {
    name: string;
    type: string;
    url: string;
  }[];

  const [message, setMessage] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [imageFiles, setImageFiles] = useState<ImageProps>([]);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const messageRef = useRef<HTMLDivElement>(null);

  // Auto-minimize timer ref
  const autoMinimizeTimer = useRef<NodeJS.Timeout | null>(null);
  // Track last interaction
  const lastInteraction = useRef<number>(Date.now());

  const { appearance, content, sound } = settings;

  const widgetStyle = {
    "--primary-color": appearance.primaryColor,
    "--secondary-color": appearance.secondaryColor,
    "--text-color": appearance.textColor,
    "--background-color": appearance.backgroundColor,
    "--border-radius": `${appearance.borderRadius}px`,
    "--font-family": appearance.fontFamily,
    "--font-size": `${appearance.fontSize}px`,
  } as React.CSSProperties;

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  const sizeClasses = {
    compact: { width: 300, height: 400 },
    medium: { width: 340, height: 500 },
    large: { width: 380, height: 600 },
  };

  const fontSizeClasses = {
    small: { size: 14 },
    medium: { size: 16 },
    large: { size: 18 },
  };

  // Get current size dimensions
  const getSizeDimensions = () => {
    if (appearance.customeChatSize) {
      return {
        width: appearance.chatSize.width as number,
        height: appearance.chatSize.height as number,
      };
    }
    return sizeClasses[appearance.size];
  };

  // Get custom font sizes
  const getFontSizes = () => {
    if (appearance.customFont) {
      return {
        size: appearance.customFontSize as number,
      };
    }
    return fontSizeClasses[appearance.fontSize];
  };

  // Helper: clear timer
  const clearAutoMinimizeTimer = useCallback(() => {
    if (autoMinimizeTimer.current) {
      clearTimeout(autoMinimizeTimer.current);
      autoMinimizeTimer.current = null;
    }
  }, []);

  // Helper: start timer
  const startAutoMinimizeTimer = useCallback(() => {
    clearAutoMinimizeTimer();
    if (
      settings.behavior?.autoMinimize?.enabled &&
      isOpen &&
      typeof settings.behavior.autoMinimize.timeout === "number" &&
      settings.behavior.autoMinimize.timeout > 0
    ) {
      autoMinimizeTimer.current = setTimeout(() => {
        setIsOpen(false);
      }, settings.behavior.autoMinimize.timeout);
    }
  }, [
    settings.behavior?.autoMinimize?.enabled,
    settings.behavior?.autoMinimize?.timeout,
    isOpen,
    clearAutoMinimizeTimer,
  ]);

  // Reset timer on open
  useEffect(() => {
    if (isOpen) {
      startAutoMinimizeTimer();
    } else {
      clearAutoMinimizeTimer();
    }
    // Clean up on unmount
    return () => {
      clearAutoMinimizeTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    settings.behavior?.autoMinimize?.enabled,
    settings.behavior?.autoMinimize?.timeout,
  ]);

  // User interaction handler
  const handleUserInteraction = useCallback(() => {
    lastInteraction.current = Date.now();
    if (isOpen && settings.behavior?.autoMinimize?.enabled) {
      startAutoMinimizeTimer();
    }
  }, [
    isOpen,
    settings.behavior?.autoMinimize?.enabled,
    startAutoMinimizeTimer,
  ]);

  // Auto Open Widget on first load if enabled
  useEffect(() => {
    if (
      settings.behavior?.autoOpen &&
      !isOpen &&
      typeof settings.behavior.autoOpenDelay === "number" &&
      settings.behavior.autoOpenDelay >= 0
    ) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, settings.behavior.autoOpenDelay);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Attach listeners for user activity inside widget
  const widgetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!settings.behavior?.autoMinimize?.enabled || !isOpen) return;
    const ref = widgetRef.current;
    if (!ref) return;
    // Listen for mouse, keyboard, and input events
    const events = ["mousedown", "keydown", "input", "focus", "touchstart"];
    events.forEach((evt) => ref.addEventListener(evt, handleUserInteraction));
    return () => {
      events.forEach((evt) =>
        ref.removeEventListener(evt, handleUserInteraction)
      );
    };
  }, [isOpen, settings.behavior?.autoMinimize?.enabled, handleUserInteraction]);

  // Reset timer when message changes (typing)
  useEffect(() => {
    if (isOpen && settings.behavior?.autoMinimize?.enabled) {
      startAutoMinimizeTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  // Memoize display message content
  const displayMessage = useMemo(() => {
    if (settings.behavior.offlineMode.enabled) {
      return settings.behavior.offlineMode.message;
    }
    return content.welcomeMessage;
  }, [settings.behavior.offlineMode.enabled]);

  const handlePreChatSubmit = () => {
    onContentUpdate?.({
      isFirstTime: false,
    });
    setIsOpen(false);
  };

  const handleUserInfoSubmit = () => {
    if (onContentUpdate) {
      onContentUpdate({
        userInfoForm: {
          ...settings.content.userInfoForm,
          showUserInfoForm: false,
        },
      });
    }
  };

  const handleAttachmentSelect = (file: File) => {
    // Add a loading message to indicate file is being uploaded
    // const loadingMessageId = `msg-${imageFiles.length + 1}`;
    const fileUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : undefined;

    setImageFiles([
      ...imageFiles,
      { name: file.name, type: file.type, url: fileUrl as string },
    ]);

    // Simulate upload process and update message when complete
    setIsImageLoading(true);
    setTimeout(() => {
      setIsImageLoading(false);
    }, 1500);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return null; // Return null for image types to remove the icon
    } else if (fileType.includes("pdf")) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-red-500"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      );
    } else if (fileType.includes("word") || fileType.includes("doc")) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-blue-700"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      );
    } else if (
      fileType.includes("sheet") ||
      fileType.includes("excel") ||
      fileType.includes("csv")
    ) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-green-600"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      );
    } else {
      return <Paperclip className="h-4 w-4 text-gray-500" />;
    }
  };

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [message, isOpen, settings.behavior.autoMinimize.enabled]);

  return (
    <div className="relative h-[650px] bg-gray-100 rounded-lg">
      {/* Mock website background */}
      <div className="absolute inset-0 p-8">
        <div className="bg-white rounded-lg shadow-sm p-6 h-full">
          <h2 className="text-2xl font-bold mb-4">Your Website</h2>
          <p className="text-gray-600 mb-4">
            This is a preview of how your chat widget will appear on your
            website.
          </p>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      {settings.integration.widgetStatus && (
        <div
          className={`absolute ${
            positionClasses[appearance.position]
          } z-10 flex flex-col items-end justify-end`}
          style={widgetStyle}
          ref={widgetRef}
        >
          {/* Minimized widget button - always visible */}
          <button
            onClick={() => {
              setIsOpen(true);
            }}
            className={cn(
              "flex items-center justify-center",
              "rounded-full w-14 h-14 shadow-lg",
              "relative chat-button bg-blue-500 hover:bg-blue-600"
              // isOpen ? "pointer-events-none opacity-0 scale-90 absolute" : "pointer-events-auto opacity-100 scale-100"
            )}
            style={{
              backgroundColor: "var(--primary-color)",
              transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
            }}
            id="chat-toggle-button"
            aria-label={isOpen ? "Close chat" : "Open chat"}
          >
            <MessageSquare className="h-6 w-6 text-white" />
          </button>
          {/* Expanded widget - animated */}
          <div
            className={cn(
              "absolute overflow-hidden flex items-end",
              // Animate width, height, and opacity
              !settings.behavior.reduceAnimations &&
                "transition-all duration-400 ease-in-out",
              // Set transform origin based on position
              appearance.position === "bottom-right"
                ? "origin-bottom-right"
                : appearance.position === "bottom-left"
                ? "origin-bottom-left"
                : appearance.position === "top-right"
                ? "origin-top-right"
                : appearance.position === "top-left"
                ? "origin-top-left"
                : "origin-bottom-right",
              isOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            )}
            style={{
              pointerEvents: isOpen ? "auto" : "none",
              right: appearance.position?.includes("right") ? 0 : undefined,
              left: appearance.position?.includes("left") ? 0 : undefined,
              bottom: appearance.position?.includes("bottom") ? 0 : undefined,
              top: appearance.position?.includes("top") ? 0 : undefined,
              width: isOpen ? getSizeDimensions().width : 56,
              height: isOpen ? getSizeDimensions().height : 56,
              minWidth: 56,
              minHeight: 56,
              overflow: "hidden",
              borderRadius: "var(--border-radius)",
            }}
          >
            {isOpen && (
              <Card
                className={`shadow-xl flex flex-col font-sans overflow-hidden transition-all duration-300 ease-in-out`}
                style={{
                  backgroundColor: "var(--background-color)",
                  borderRadius: "var(--border-radius)",
                  fontFamily: "var(--font-family)",
                  fontSize: "var(--font-size)",
                  width: getSizeDimensions().width,
                  height:
                    settings.content.formType === "chat-badge"
                      ? "auto"
                      : getSizeDimensions().height,
                }}
              >
                {/* Header */}
                {settings.content.formType === "chat-badge" ? (
                  <div
                    className="flex items-center justify-end py-2 px-2.5 relative"
                    style={{
                      backgroundColor: "var(--primary-color)",
                      borderTopLeftRadius: "var(--border-radius)",
                      borderTopRightRadius: "var(--border-radius)",
                    }}
                  >
                    <div
                      // className="absolute top-[calc(100%+0.5rem)] left-[50%] -translate-x-1/2 text-[0.6875rem] leading-none pt-1 pb-1.5 px-3 text-center shadow-lg rounded-md"
                      className="absolute bottom-1 text-white left-[50%] z-10 -translate-x-1/2 text-[0.6875rem] leading-none pt-1 pb-1.5 px-3 text-center"
                      style={{
                        fontFamily: settings.appearance.fontFamily,
                      }}
                    >
                      Powered by Kogents
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          clearAutoMinimizeTimer();
                        }}
                        className="text-white hover:text-gray-200 transition-colors"
                        aria-label="Close chat"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-between py-2 px-2.5"
                    style={{
                      backgroundColor: "var(--primary-color)",
                      borderTopLeftRadius: "var(--border-radius)",
                      borderTopRightRadius: "var(--border-radius)",
                    }}
                  >
                    <div className="flex items-center">
                      {appearance.showCompanyLogo && (
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2.5">
                          {/* Custom Header Icon with dynamic color */}
                          <HeaderIcon
                            className="w-5 h-5"
                            color={appearance.primaryColor}
                            size={20}
                          />
                        </div>
                      )}
                      <div style={{ fontFamily: appearance.fontFamily }}>
                        <div className="flex gap-2">
                          <h3 className="font-medium text-white">
                            Live Chat Support
                          </h3>
                        </div>
                        <div className="flex items-center text-xs">
                          <div className="text-xs flex items-center">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full mr-1.5",
                                settings.behavior.offlineMode.enabled
                                  ? "bg-gray-300 "
                                  : "bg-green-400"
                              )}
                            ></div>
                            <span className="text-white">
                              {settings.behavior.offlineMode.enabled
                                ? "Offline"
                                : "Online"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button
                        // onClick={() => onSoundUpdate?.({soundEnabled: !isMuted})}
                        // className="text-white hover:bg-white/20 p-1 h-auto"
                        className="text-white hover:text-gray-200 transition-colors mr-2"
                      >
                        {settings.sound.soundEnabled ? (
                          <Volume2 className="w-4 h-4" />
                        ) : (
                          <VolumeX className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        // onClick={toggleFullScreen}
                        className="text-white hover:text-gray-200 transition-colors mr-2"
                        aria-label="Full Screen"
                        title="Full Screen"
                      >
                        {/* {isFullScreen ? ( */}
                        {/* <Minimize className="h-4 w-4" /> */}
                        {/* ) : ( */}
                        <Maximize className="h-4 w-4" />
                        {/* )} */}
                      </button>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          clearAutoMinimizeTimer();
                        }}
                        className="text-white hover:text-gray-200 transition-colors"
                        aria-label="Close chat"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Messages */}
                {settings.content.formType === "chat-window" && (
                  <div
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 chat-widgets-preview-scroll"
                    style={{ backgroundColor: appearance.backgroundColor }}
                  >
                    <MessageItem
                      message={displayMessage}
                      isAgent={true}
                      settings={settings}
                      fontSize={getFontSizes().size}
                      fontFamily={appearance.fontFamily}
                    />
                    {imageFiles && imageFiles.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {imageFiles.map((attachment, idx) => (
                          <div key={idx} className="flex flex-col gap-2">
                            {/* File info with small thumbnail for images */}
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border text-sm">
                              <div className="flex items-center gap-2">
                                {getFileIcon(attachment.type)}
                                {attachment.type.startsWith("image/") &&
                                  attachment.url && (
                                    <a
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <img
                                        src={attachment.url}
                                        alt={attachment.name}
                                        className="w-[52px] h-[40px] object-cover rounded-sm border border-gray-200"
                                      />
                                    </a>
                                  )}
                                <span className="truncate flex-1 font-medium ml-1">
                                  {attachment.name}
                                </span>
                              </div>
                              {/* {isImageLoading ? (
                                <span className="text-xs text-gray-500 animate-pulse ml-auto">
                                  Uploading...
                                </span>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs hover:bg-gray-200 ml-auto"
                                  // onClick={() =>
                                  //   handleDownloadImage(attachment)
                                  // }
                                >
                                  Download
                                </Button>
                              )} */}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="space-y-2">
                      {message.length > 0 &&
                        message.map((msg, idx) => (
                          <MessageItem
                            key={idx}
                            message={msg}
                            isAgent={false}
                            settings={settings}
                            fontSize={getFontSizes().size}
                            fontFamily={appearance.fontFamily}
                          />
                        ))}
                      <div ref={messageRef}></div>
                    </div>
                  </div>
                )}

                {/* Pre Chat Form */}
                {settings.content.formType === "pre-chat" && (
                  <PreChatForm settings={settings} />
                )}

                {/* Offline Chat Form */}
                {settings.content.formType === "offline-chat" && (
                  <OfflineChatForm settings={settings} />
                )}

                {/* Post Chat Form */}
                {settings.content.formType === "post-chat" && (
                  <PostChatForm
                    settings={settings}
                    onContentUpdate={onContentUpdate}
                  />
                )}

                {/* User Info Form Modal */}
                {settings.content.userInfoForm?.enabled &&
                  settings.content.userInfoForm.showUserInfoForm && (
                    <div
                      style={{
                        borderRadius: "var(--border-radius)",
                      }}
                      className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-md px-4"
                    >
                      <div
                        className="relative w-full max-h-[50dvh] min-h-[30dvh] overflow-y-auto max-w-xs sm:max-w-sm md:max-w-md bg-white shadow-lg p-6 flex flex-col items-center"
                        style={{
                          backgroundColor: appearance.backgroundColor,
                          fontFamily: appearance.fontFamily,
                          color: appearance.textColor,
                        }}
                      >
                        <h4
                          className="mb-4 text-lg font-semibold"
                          style={{ color: appearance.primaryColor }}
                        >
                          User Info
                        </h4>
                        <form
                          action={handleUserInfoSubmit}
                          className="flex flex-col w-full space-y-3"
                          style={{ fontFamily: appearance.fontFamily }}
                        >
                          {settings.content.userInfoForm.fields.map(
                            (field, index) => (
                              <div key={index} className="flex flex-col">
                                {/* Text or Email Field */}
                                {(field.type === "text" ||
                                  field.type === "email") && (
                                  <div className="flex flex-col space-y-2">
                                    <Label>{field.label}</Label>
                                    <Input
                                      type={field.type}
                                      placeholder={field.placeholder}
                                      style={{
                                        backgroundColor:
                                          appearance.backgroundColor,
                                        color: appearance.textColor,
                                        borderColor: appearance.primaryColor,
                                        fontFamily: appearance.fontFamily,
                                      }}
                                    />
                                  </div>
                                )}
                                {/* Textarea */}
                                {field.type === "textarea" && (
                                  <div className="flex flex-col space-y-2">
                                    <Label>{field.label}</Label>
                                    <textarea
                                      rows={4}
                                      id={field.id}
                                      className="w-full border rounded-md p-3"
                                      placeholder={field.placeholder}
                                      style={{
                                        backgroundColor:
                                          appearance.backgroundColor,
                                        color: appearance.textColor,
                                        borderColor: appearance.primaryColor,
                                        fontFamily: appearance.fontFamily,
                                      }}
                                    />
                                  </div>
                                )}
                                {/* Dropdown */}
                                {field.type === "select" && (
                                  <div className="space-y-2">
                                    <Label>{field.label}</Label>
                                    <Select>
                                      <SelectTrigger
                                        style={{
                                          backgroundColor:
                                            appearance.backgroundColor,
                                          color: appearance.textColor,
                                          borderColor: appearance.primaryColor,
                                          fontFamily: appearance.fontFamily,
                                        }}
                                      >
                                        <SelectValue
                                          placeholder={field.placeholder}
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {field.options?.map(
                                          (option: string, idx: number) => (
                                            <SelectItem
                                              key={idx}
                                              value={option}
                                            >
                                              {option}
                                            </SelectItem>
                                          )
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                                {/* Checkbox */}
                                {field.type === "checkbox" && (
                                  <div className="flex items-center gap-3 relative">
                                    <input
                                      id={field.id}
                                      type="checkbox"
                                      className="peer appearance-none w-5 h-5 border border-gray-300 rounded bg-gray-200 checked:bg-[var(--primary-color)] checked:border-[var(--primary-color)] focus:outline-none transition-colors"
                                      style={
                                        {
                                          "--primary-color":
                                            appearance.primaryColor,
                                        } as React.CSSProperties
                                      }
                                    />
                                    {/* Custom checkmark */}
                                    <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5">
                                      <Check
                                        size={16}
                                        className="checked:block text-white"
                                      />
                                    </span>
                                    <Label
                                      htmlFor={field.id}
                                      className="select-none cursor-pointer"
                                    >
                                      {field.label}
                                    </Label>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                          <div className="w-full pt-2 flex justify-between">
                            <button
                              className="px-3 py-1 text-black border  rounded-lg hover:opacity-80 cursor-pointer text-sm"
                              style={{
                                fontFamily: appearance.fontFamily,
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              className="px-3 py-1 text-white rounded-lg hover:opacity-80 cursor-pointer text-sm"
                              style={{
                                backgroundColor: appearance.primaryColor,
                                fontFamily: appearance.fontFamily,
                              }}
                              type="submit"
                            >
                              Submit
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                {/* Chat Badge */}
                {settings.content.formType === "chat-badge" && (
                  <div className="bg-white content-center">
                    <img
                      src="/HELLO.webp"
                      className="w-[200px] h-[200px] object-cover mx-auto"
                      alt="hello"
                    />
                  </div>
                )}

                {/* Chat Input */}
                {(settings.content.formType === "chat-window" ||
                  settings.content.formType === "chat-badge") && (
                  <ChatInput
                    hidePoweredBy={message.length < 2}
                    message={message}
                    setMessage={setMessage}
                    settings={settings}
                    fontSize={getFontSizes().size}
                    fontFamily={appearance.fontFamily}
                    onContentUpdate={onContentUpdate}
                    handleAttachmentSelect={handleAttachmentSelect}
                  />
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
