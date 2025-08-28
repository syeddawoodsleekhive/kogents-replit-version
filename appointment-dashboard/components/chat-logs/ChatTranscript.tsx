import { User } from "lucide-react";

export const ChatTranscript = ({ messages }: { messages: MessageType[] }) => {
  return (
    <div className="space-y-3 overflow-y-auto px-2">
      {messages.map((entry: MessageType, index: number) => {
        const isAgent = entry.senderType === "agent";
        const isSystem =
          entry.senderType === "agent-system" ||
          entry.senderType === "visitor-system";

        if (isSystem) {
          return (
            <div key={index} className="text-center">
              <div className="inline-block px-3 py-1 bg-gray-100 rounded-full">
                <span className="text-xs text-gray-500">{entry.content}</span>
              </div>
            </div>
          );
        }

        return (
          <div
            key={index}
            className={`flex ${isAgent ? "justify-start" : "justify-end"} mb-4`}
          >
            <div
              className={`flex items-start gap-3 ${
                isAgent ? "flex-row" : "flex-row-reverse"
              }`}
            >
              {/* Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isAgent ? "bg-gray-200" : "bg-gray-200"
                }`}
              >
                {isAgent ? (
                  <User className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>

              {/* Message Content */}
              <div className={`max-w-xs lg:max-w-md`}>
                <div
                  className={`px-3 py-2 rounded-lg ${
                    isAgent
                      ? "bg-gray-200 text-gray-900"
                      : "bg-[#171717] text-white"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{entry.content}</p>
                </div>

                {/* Timestamp */}
                <div
                  className={`mt-2 text-xs text-gray-500 ${
                    isAgent ? "text-left" : "text-right"
                  }`}
                >
                  {(() => {
                    try {
                      const entryTime = new Date(entry.createdAt);
                      if (!isNaN(entryTime.getTime())) {
                        return entryTime.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        });
                      }
                    } catch (e) {
                      console.error("Error formatting entry time:", e);
                    }
                    return "Unknown Time";
                  })()}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
