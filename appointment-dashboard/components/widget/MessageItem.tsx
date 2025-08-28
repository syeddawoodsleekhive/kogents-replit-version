"use client";

import { renderMarkdown } from "@/functions";
import { cn } from "@/lib/utils";
import { WidgetSettings } from "@/types/widget";
import { Bot, CheckCheck } from "lucide-react";
import { useMemo } from "react";

export default function MessageItem({
  message,
  isAgent,
  settings,
  fontSize,
  fontFamily,
}: {
  message: string;
  isAgent: boolean;
  settings: WidgetSettings;
  fontSize: number;
  fontFamily: string;
}) {
  const tempTimestamp = new Date();
  const formattedTime = formatTime(tempTimestamp);
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
      className={cn(
        "flex",
        isAgent ? "justify-start" : "justify-end",
        "align-center gap-2 font-sans"
      )}
      role="listitem"
      style={{
        fontFamily,
      }}
    >
      {settings.appearance.showAgentAvatar && (
        <>
          {isAgent &&
            (settings.appearance.logo !== "" ? (
              <img
                src="https://picsum.photos/id/1/200/300"
                alt=""
                height={32}
                width={32}
                className="rounded-[2rem] overflow-hidden max-h-8 max-w-8"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-[2rem] overflow-hidden flex items-center justify-center"
                style={{
                  backgroundColor: secondaryColor,
                }}
              >
                <Bot size={16} data-testid="lucide-bot" color={primaryColor} />
              </div>
            ))}
        </>
      )}

      <div className="max-w-[80%]">
        {isAgent && (
          <p className="text-gray-400 text-xs mb-1">{`Live Agent`}</p>
        )}

        <div
          className={cn(
            "rounded-lg p-3 relative",
            isAgent && "border border-gray-200"
          )}
          style={{
            backgroundColor: isAgent ? secondaryColor : primaryColor,
            color: isAgent ? textColor : "#ffffff",
          }}
        >
          {message && (
            <p
              style={{ wordBreak: "break-word", fontSize }}
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(message),
              }}
            />
          )}
          {/* {message.attachment && (
                <FileAttachment
                  file={message.attachment}
                  isUserMessage={!isAgent}
                />
              )} */}
          <div className="flex items-center justify-end mt-1 gap-1">
            <span
              className={cn(
                "text-xs",
                isAgent ? "text-gray-500" : "text-white"
              )}
            ></span>
            {/* {!isAgent && message.status && (
                  <ReadReceipt status={message.status} className="text-xs" />
                )} */}
          </div>
        </div>
        <div className="flex items-center justify-end mr-[-0.125rem] mt-1 gap-0.5">
          <span className="text-[0.625rem] text-gray-500">{formattedTime}</span>
          <span>
            <CheckCheck size={11} className="text-gray-500" />
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
}
