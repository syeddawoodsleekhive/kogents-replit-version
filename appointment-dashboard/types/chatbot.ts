import type React from "react";
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Chatbot {
  id: number;
  name: string;
  status: "active" | "inactive" | "draft";
  messages: number;
  performance: number;
  lastActive: string
  description?: string;
}

export interface Metric {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export interface UsageMetric {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavigationItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  isActive?: boolean;
}
