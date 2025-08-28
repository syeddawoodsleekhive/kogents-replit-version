import React, { useMemo } from "react";

interface ChatMetricsTabProps {
  selectedChat?: conversationSessionType | null;
}

const ChatMetricsTab: React.FC<ChatMetricsTabProps> = ({ selectedChat }) => {
  const metrics = useMemo(() => {
    if (!selectedChat?.messages || selectedChat.messages.length === 0) {
      return {
        agentTurns: 0,
        userTurns: 0,
        aiAgentTurns: 0,
        totalTurns: 0,
        conversationDuration: 0,
        userAffirmations: 0,
        interruptions: 0,
        disengagement: "No",
        engagementScore: 0,
      };
    }

    const messages = selectedChat.messages;
    const totalMessages = messages.length;

    let agentTurns = 0;
    let userTurns = 0;
    let aiAgentTurns = 0;
    let userAffirmations = 0;
    let interruptions = 0;
    let hasDisengagement = false;

    const affirmationWords = [
      "yes",
      "ok",
      "okay",
      "sure",
      "alright",
      "good",
      "great",
      "perfect",
      "fine",
      "correct",
    ];

    const firstMessage = messages[0];
    const lastMessage = messages[totalMessages - 1];
    const startTime = new Date(firstMessage.createdAt || Date.now()).getTime();
    const endTime = new Date(lastMessage.createdAt || Date.now()).getTime();
    const conversationDuration = Math.round((endTime - startTime) / 1000);

    for (let i = 0; i < totalMessages; i++) {
      const message = messages[i];
      const senderType = message.senderType;

      if (senderType === "agent") agentTurns++;
      else if (senderType === "visitor") userTurns++;
      else if (senderType === "ai-agent") aiAgentTurns++;

      if (senderType === "visitor" && message.content) {
        const content = message.content.toLowerCase();
        if (affirmationWords.some((word) => content.includes(word))) {
          userAffirmations++;
        }
      }

      if (i < totalMessages - 1) {
        const nextMessage = messages[i + 1];

        if (
          (senderType === "agent" || senderType === "ai-agent") &&
          nextMessage.senderType === "visitor"
        ) {
          const timeDiff =
            new Date(nextMessage.createdAt || Date.now()).getTime() -
            new Date(message.createdAt || Date.now()).getTime();
          if (timeDiff < 10000) {
            interruptions++;
          }
        }

        if (!hasDisengagement) {
          const timeDiff =
            new Date(nextMessage.createdAt || Date.now()).getTime() -
            new Date(message.createdAt || Date.now()).getTime();
          if (timeDiff > 300000) {
            hasDisengagement = true;
          }
        }
      }
    }

    const totalTurns = agentTurns + userTurns + aiAgentTurns;
    const disengagement = hasDisengagement ? "Yes" : "No";

    let score = 0;
    if (Math.abs(userTurns - (agentTurns + aiAgentTurns)) <= 1) score += 20;

    if (totalMessages >= 6) score += 30;
    else if (totalMessages >= 4) score += 20;
    else if (totalMessages >= 2) score += 10;

    score -= interruptions * 5;
    if (hasDisengagement) score -= 15;

    const engagementScore = Math.max(0, Math.min(100, score));

    return {
      agentTurns,
      userTurns,
      aiAgentTurns,
      totalTurns,
      conversationDuration,
      userAffirmations,
      interruptions,
      disengagement,
      engagementScore,
    };
  }, [selectedChat?.messages]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 text-lg mb-3">
          Conversation Metrics
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Turns:</span>
              <span className="font-medium text-gray-900">
                {metrics.totalTurns}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">User Turns:</span>
              <span className="font-medium text-gray-900">
                {metrics.userTurns}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Live Agent Turns:</span>
              <span className="font-medium text-gray-900">
                {metrics.agentTurns}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">AI Agent Turns:</span>
              <span className="font-medium text-gray-900">
                {metrics.aiAgentTurns}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium text-gray-900">
                {metrics.conversationDuration}s
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">User Affirmations:</span>
              <span className="font-medium text-gray-900">
                {metrics.userAffirmations}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Interruptions:</span>
              <span className="font-medium text-gray-900">
                {metrics.interruptions}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Disengagement:</span>
              <span className="font-medium text-gray-900">
                {metrics.disengagement}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Agent Engagement:</span>
              <span className="font-medium text-gray-900">
                {100 - (metrics.engagementScore || 0)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">User Engagement:</span>
              <span className="font-medium text-gray-900">
                {metrics.engagementScore}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMetricsTab;
