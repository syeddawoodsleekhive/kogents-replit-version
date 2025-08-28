"use client";

import { OptimizedMetricsCards } from "@/components/chatbots/optimized-metrics-cards";
import WelcomeSection from "@/components/chatbots/welcome-section";
import Chatbots from "@/components/chatbots/Chatbots";
import { useOptimizedDashboard } from "@/hooks/chatbots/useOptimizedDashboard";

const ChatBots = () => {
  // const dashboardData = useOptimizedDashboard();
  return (
    <main className="p-4 md:p-6 space-y-6">
      <WelcomeSection />
      <OptimizedMetricsCards />
      <Chatbots />
    </main>
  );
};

export default ChatBots;
