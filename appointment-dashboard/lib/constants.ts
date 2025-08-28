import {
  Home,
  Bot,
  BarChart3,
  Settings,
  HelpCircle,
  MessageSquare,
  MessageSquareIcon,
  FileText,
  TrendingUp,
} from "lucide-react";
import type { NavigationItem, Metric } from "@/types/chatbot";

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { title: "Home", icon: Home, url: "/dashboard", isActive: true },
  { title: "ChatBots", icon: Bot, url: "/dashboard/chatbots" },
  { title: "Analytics", icon: BarChart3, url: "/dashboard/analytics" },
  { title: "Settings", icon: Settings, url: "/dashboard/settings" },
];

export const SUPPORT_ITEMS: NavigationItem[] = [
  { title: "Help Center", icon: HelpCircle, url: "/help" },
  { title: "Contact Support", icon: MessageSquare, url: "/support" },
];

export const METRICS: Metric[] = [
  {
    title: "Messages Sent",
    value: "12,847",
    change: "+12%",
    icon: MessageSquareIcon,
    color: "text-blue-600",
  },
  {
    title: "Active Bots",
    value: "8",
    change: "+2",
    icon: Bot,
    color: "text-green-600",
  },
  {
    title: "Knowledge Docs",
    value: "24",
    change: "+4",
    icon: FileText,
    color: "text-purple-600",
  },
  {
    title: "Response Rate",
    value: "98.5%",
    change: "+0.5%",
    icon: TrendingUp,
    color: "text-orange-600",
  },
];
