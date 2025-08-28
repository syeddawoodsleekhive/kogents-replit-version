"use client";

import React from "react";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Chatbot } from "@/types/chatbots/dashboard";

interface ChatbotCardProps {
  chatbot: Chatbot;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
}

export const ChatbotCard = React.memo(function ChatbotCard({
  chatbot,
  onEdit,
  onDelete,
  isDeleting = false,
}: ChatbotCardProps) {
  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{chatbot.name}</CardTitle>
            <CardDescription className="text-sm">
              {chatbot.description}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(chatbot.id)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Analytics</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(chatbot.id)}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge
            variant={chatbot.status === "active" ? "default" : "secondary"}
            className={
              chatbot.status === "active" ? "bg-green-100 text-green-800" : ""
            }
          >
            {chatbot.status === "active" ? "Active" : "Inactive"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {chatbot.lastActive}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Messages</div>
            <div className="font-medium">
              {chatbot.messages.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Performance</div>
            <div className="font-medium">{chatbot.performance}%</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" disabled={isDeleting}>
            Configure
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={isDeleting}
          >
            Test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
