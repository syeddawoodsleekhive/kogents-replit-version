import { format } from "date-fns";
import { Badge } from "./ui/badge";
import { Visitor } from "@/types/visitor";

function highlightText(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  return text.split(regex).map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 text-black rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const ChatLogItem = ({
  conversation,
  onClick,
  searchQuery,
}: {
  conversation: Visitor;
  onClick: any;
  searchQuery: string;
}) => {
  const formatTimestamp = (timestamp: Date) => {
    try {
      const date = new Date(timestamp);
      return format(date, "MMM d, yyyy h:mm a");
    } catch (error) {
      return "Invalid date";
    }
  };

  const filteredMessages = conversation.chats?.filter(
    (e) => e.sender !== "system"
  );

  const hasSearchMatch = filteredMessages
    ? [...filteredMessages]
        .reverse()
        .find(
          (chat) =>
            typeof chat.content === "string" &&
            chat.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : undefined;

  return (
    <div className="p-4 hover:bg-muted/50 cursor-pointer" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{conversation.name}</Badge>
          <span className="font-medium">
            {conversation?.visitorInfo?.name || conversation.name}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {formatTimestamp(conversation.createdAt)}
        </div>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        {conversation?.visitorInfo?.email || "No email"}
        {conversation?.visitorInfo?.phone
          ? ` • ${conversation?.visitorInfo?.phone}`
          : null}
      </div>
      <div className="mt-2 text-sm line-clamp-1">
        {conversation?.call_outcome?.summary ||
          (searchQuery && hasSearchMatch
            ? highlightText(hasSearchMatch.content, searchQuery)
            : "No summary yet")}
      </div>
      <div className="mt-2 flex items-center gap-4">
        <div className="text-xs text-muted-foreground">
          {filteredMessages?.length || 0} messages
        </div>
        <div className="text-xs flex items-center gap-1">
          <span
            className={
              conversation?.call_outcome?.lead_status === "Booked"
                ? "text-green-600"
                : "text-amber-600"
            }
          >
            {conversation?.call_outcome?.lead_status}
          </span>
        </div>
        <div className="text-xs flex items-center gap-1">
          <span>Engagement:</span>
          <span className="font-medium">
            {conversation?.call_outcome
              ? Math.round(conversation?.call_outcome?.engagement_score * 100)
              : 0}
            %
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatLogItem;
