import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import moment from "moment";

interface ChatLogsTableProps {
  chatSessions: ChatHistorySummaryType[];
  selectedChats: string[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  isLoading: boolean;
  onChatSelection: (chat: ChatHistorySummaryType) => void;
  onChatCheckbox: (chatId: string) => void;
  onSelectAll: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

const ChatLogsTable = ({
  chatSessions,
  selectedChats,
  currentPage,
  totalPages,
  itemsPerPage,
  isLoading,
  onChatSelection,
  onChatCheckbox,
  onSelectAll,
  onPrevPage,
  onNextPage,
}: ChatLogsTableProps) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentChats = chatSessions.slice(startIndex, endIndex);

  return (
    <div className="flex-1 overflow-y-auto relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-gray-500 animate-spin" />
            <span className="text-sm font-medium text-gray-700">
              Loading...
            </span>
          </div>
        </div>
      )}

      <table className="w-full">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Checkbox
                checked={selectedChats.length === chatSessions.length}
                onCheckedChange={onSelectAll}
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Agent
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Messages
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {currentChats.map((chat) => (
            <tr
              key={chat.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onChatSelection(chat)}
            >
              <td className="px-4 py-3">
                <Checkbox
                  checked={selectedChats.includes(chat.id)}
                  onCheckedChange={() => onChatCheckbox(chat.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {chat.visitorName || `#${chat.visitorId}`}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {chat.agentsInRoom[0]?.name || "No agent"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {moment(chat.createdAt).format("DD MMM YYYY, hh:mm A")}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">-</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-primary text-xs text-white cursor-pointer">
                  {chat.totalMessages}
                </span>{" "}
                {chat.lastMessage?.content?.substring(0, 50) || ""}...
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Page Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {isLoading
              ? "Loading..."
              : `Showing ${startIndex + 1} to ${Math.min(
                  endIndex,
                  chatSessions.length
                )} of ${chatSessions.length} results`}
          </span>
          <span>
            {isLoading ? "..." : `Page ${currentPage} of ${totalPages}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatLogsTable;
