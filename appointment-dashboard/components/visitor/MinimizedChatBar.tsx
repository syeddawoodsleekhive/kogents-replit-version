import { Badge } from "@/components/ui/badge";
import { useChatEvents } from "@/hooks/useChatEvents";
import { cn } from "@/lib/utils";
import { Visitor } from "@/types/visitor";
import { MessageSquareMore, X } from "lucide-react";
import { useSelector } from "react-redux";

interface MinimizedChatBarProps {
  minimizedChats: MinimizedChat[];
  onReopenChat: (id: string) => void;
  removeMinimizedChats: (id: string) => void;
  handleActiveMinimizedChat: (id: string) => void;
  ref: React.RefObject<HTMLDivElement | null>;
}

export const MinimizedChatBar = ({
  minimizedChats,
  onReopenChat,
  removeMinimizedChats,
  handleActiveMinimizedChat,
  ref,
}: MinimizedChatBarProps) => {
  const { unreadCounts, typingStates, activeChatId } = useChatEvents();
  const joinedRooms = useSelector(
    (state: RootReducerState) => state.chat.joinedRooms
  );

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (joinedRooms.includes(id)) {
      handleActiveMinimizedChat(id);
    } else {
      removeMinimizedChats(id);
    }
  };

  if (minimizedChats.length === 0) return null;

  return (
    <div
      className="fixed bottom-[-1px] right-0 z-[100] px-3 w-screen max-w-[calc(100vw-16rem)] flex items-end gap-[0.125rem] overflow-hidden"
      style={{ pointerEvents: "all" }}
      ref={ref}
    >
      {minimizedChats.map((chat) => {
        const unreadCount = unreadCounts[chat.id] || 0;
        const isTyping = typingStates[chat.id]?.isTyping || false;

        return (
          <div
            key={chat.id}
            className="group flex-shrink min-w-0 bg-white border rounded-t-lg shadow-lg cursor-pointer max-w-[14rem] relative"
            onClick={() => onReopenChat(chat.id)}
          >
            <div
              // className={cn(
              //   "flex justify-between items-center bg-black text-white gap-2 rounded-t-lg min-w-0 pl-3 pr-[2.9375rem] py-2 transition-all group-hover:py-3",
              //   activeChat?.id === chat.id && "py-3"
              // )}
              className={cn(
                "flex justify-between items-center bg-black text-white gap-2 rounded-t-lg min-w-0 pl-3 pr-[2.375rem] py-2 transition-all group-hover:py-3",
                activeChatId === chat.id && "py-3"
              )}
            >
              <div className="flex items-center gap-2 font-medium min-w-0">
                <MessageSquareMore className="h-[1.1875rem] w-[1.1875rem] flex-shrink-0" />
                <span
                  className={cn(
                    "truncate block text-sm min-w-0",
                    isTyping && "opacity-0"
                  )}
                >
                  {chat.name ? chat.name.replace("#", "") : ""}
                </span>

                {isTyping && (
                  <span className="absolute left-10 text-xs text-gray-300 animate-pulse">
                    Typing...
                  </span>
                )}

                {unreadCount > 0 && activeChatId !== chat.id && (
                  <Badge className="absolute right-3 bg-red-500 text-[0.625rem] flex-shrink-0 group-hover:hidden px-[0.375rem] py-[0.0625rem] animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}

                <button
                  className="absolute items-center justify-center w-[1.125rem] h-[1.125rem] right-3 hidden group-hover:flex"
                  onClick={(e) => handleRemove(e, chat.id)}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
