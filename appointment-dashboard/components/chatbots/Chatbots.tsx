"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Play } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function Chatbots() {
  const mockChatbots = [
    {
      id: 1,
      name: "Customer Support Bot",
      status: "active",
      messages: 1247,
      performance: 94,
      lastActive: "2 minutes ago",
      description: "Handles customer inquiries and support tickets",
    },
    {
      id: 2,
      name: "Sales Assistant",
      status: "active",
      messages: 856,
      performance: 89,
      lastActive: "5 minutes ago",
      description: "Assists with product recommendations and sales",
    },
    {
      id: 3,
      name: "FAQ Bot",
      status: "inactive",
      messages: 432,
      performance: 76,
      lastActive: "2 hours ago",
      description: "Answers frequently asked questions",
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Chatbots
          </h1>
          <p className="text-muted-foreground">
            Manage and configure your AI assistants
          </p>
        </div>
        {/* <Button className="gap-2 w-full sm:w-auto" asChild>
          <Link href="/demo-company/chatbots/create">
            <Plus className="h-4 w-4" />
            Create New Chatbot
          </Link>
        </Button> */}
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {mockChatbots.map((bot) => (
          <Card key={bot.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{bot.name}</CardTitle>
                  <CardDescription className="text-sm line-clamp-2">
                    {bot.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      bot.status === "active" ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground capitalize">
                    {bot.status}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Messages</div>
                  <div className="font-medium">
                    {bot.messages.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Performance</div>
                  <div className="font-medium">{bot.performance}%</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Last active: {bot.lastActive}
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1 gap-1">
                  <Settings className="h-3 w-3" />
                  <span className="hidden sm:inline">Configure</span>
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1">
                  <Play className="h-3 w-3" />
                  <span className="hidden sm:inline">Test</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
