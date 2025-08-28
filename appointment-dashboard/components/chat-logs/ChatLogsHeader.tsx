import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface ChatLogsHeaderProps {
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  selectedChats: string[];
  chatSessionsCount: number;
  showRightPanel: boolean;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onSelectAll: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

const ChatLogsHeader = ({
  searchTerm,
  currentPage,
  totalPages,
  selectedChats,
  chatSessionsCount,
  showRightPanel,
  isLoading,
  onSearchChange,
  onClearSearch,
  onSelectAll,
  onPrevPage,
  onNextPage,
}: ChatLogsHeaderProps) => {
  return (
    <div className="p-4 border-b border-gray-200">
      {/* {!showRightPanel && (
             <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
               <div className="flex items-center gap-2 text-blue-700">
                 <MessageCircle className="w-4 h-4" />
                 <span className="text-sm font-medium">Right panel closed - Table expanded to full width</span>
               </div>
             </div>
           )} */}
      <div
        className={`flex items-center justify-between mb-4`}
        style={{ marginRight: showRightPanel ? "50vw" : "" }}
      >
        <div className="relative flex items-center gap-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-64"
          />
          {searchTerm && (
            <Button variant="ghost" size="sm" onClick={onClearSearch}>
              Clear search
            </Button>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">
            Page {currentPage} of {totalPages.toLocaleString()}{" "}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div
        className={`flex items-center justify-between`}
        style={{ marginRight: showRightPanel ? "50vw" : "" }}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedChats.length === chatSessionsCount}
            onCheckedChange={onSelectAll}
          />
          <span className="text-sm text-gray-600">Select All</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1 || isLoading}
            onClick={onPrevPage}
          >
            ←
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || isLoading}
            onClick={onNextPage}
          >
            →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatLogsHeader;
