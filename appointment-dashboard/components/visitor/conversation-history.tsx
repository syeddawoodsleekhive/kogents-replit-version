"use client";

import { Bot, Download, Eye, User, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Visitor } from "@/types/visitor";
import React from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import moment from "moment";
import Link from "next/link";

interface ConversationHistoryProps {
  conversation: Visitor;
  onClose: () => void;
  isClose: boolean;
  isDownload: boolean;
  title: string;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  title,
  conversation,
  onClose,
  isClose,
  isDownload,
}) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 flex-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {title ? title : "Conversation History"}
          </CardTitle>
          <div className="flex items-center gap-3">
            {isDownload && (
              <span className="cursor-pointer hover:bg-gray-200 p-2 transition rounded-md">
                <Download size={18} />
              </span>
            )}
            {isClose && (
              <span
                onClick={handleClose}
                className="cursor-pointer hover:bg-gray-200 p-2 transition rounded-md"
              >
                <X size={18} />
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "flex-auto pr-2 space-y-4 overflow-y-scroll",
          isClose ? "h-[300px] min-h-[33dvh]" : "max-h-[78dvh]"
        )}
      >
        {/* <div className=""> */}
        {conversation?.chats?.map((message, index) => (
          <div key={index}>
            <div
              className={`flex gap-3 ${
                message.sender === "agent" || message.sender === "live-agent"
                  ? "justify-start"
                  : message.sender === "system"
                  ? "justify-center"
                  : "justify-end"
              }`}
            >
              {(message.sender === "agent" ||
                message.sender === "live-agent") && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {message.sender === "live-agent" ? (
                    <User className="h-4 w-4 text-primary" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg overflow-hidden text-ellipsis ${
                  message.sender === "agent" || message.sender === "live-agent"
                    ? "bg-muted p-3 "
                    : message.sender === "system"
                    ? "text-gray-400 text-xs"
                    : "bg-primary text-primary-foreground p-3"
                }`}
              >
                {message?.pageUrl ? (
                  <Link
                    href={message?.pageUrl}
                    target="_blank"
                    className="flex items-center justify-center text-sm gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="hover:underline">{message.content}</span>
                  </Link>
                ) : (
                  <div className="text-sm break-all">{message.content}</div>
                )}
              </div>
              {message.sender === "user" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
            {(!message.isSystem || message.isVisitor) && (
              <div
                className={cn(
                  "text-xs flex mt-1  text-end text-gray-500 font-light",
                  message.sender === "agent" || message.sender === "live-agent"
                    ? "justify-start ml-11"
                    : "justify-end mr-11"
                )}
              >
                {moment(message.timestamp).format("h:mm A")}
              </div>
            )}
          </div>
        ))}
        {/* </div> */}
      </CardContent>
    </Card>
  );
};

export default ConversationHistory;
