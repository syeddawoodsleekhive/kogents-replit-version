import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import React from "react";

const NewMessageBadge = React.memo(
  ({
    onClick,
    messageCount,
  }: {
    onClick: () => void;
    messageCount: number;
  }) => (
    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-10">
      <Badge
        onClick={onClick}
        className="cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 px-2 py-2 bg-white text-gray-700 border border-gray-300"
      >
        {messageCount > 0 && (
          <div className="bg-red-500 text-white text-[0.625rem] rounded-full w-4 h-4 flex items-center justify-center font-medium mr-[0.125rem]">
            {messageCount > 9 ? "9+" : messageCount}
          </div>
        )}
        New Message
        <ChevronDown className="w-4 h-4" />
      </Badge>
    </div>
  )
);

NewMessageBadge.displayName = "NewMessageBadge";

export default NewMessageBadge;
