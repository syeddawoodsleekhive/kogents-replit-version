import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const ActionButton = ({
  setShowAction,
}: {
  setShowAction: (action: actionModalType) => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 bg-gray-700 hover:bg-gray-600 hover:text-white text-white border-0"
        >
          Actions
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 bg-white border border-gray-200 shadow-lg"
      >
        <DropdownMenuItem
          className="cursor-pointer hover:bg-gray-50 px-3 py-2 text-sm"
          onClick={() => setShowAction("invite-agent")}
        >
          Invite agent/transfer to agent
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer hover:bg-gray-50 px-3 py-2 text-sm"
          onClick={() => setShowAction("transfer-department")}
        >
          Transfer to department
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer hover:bg-blue-50 hover:text-blue-600 px-3 py-2 text-sm"
          onClick={() => setShowAction("export-transcript")}
        >
          Export transcript
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer hover:bg-gray-50 px-3 py-2 text-sm"
          onClick={() => setShowAction("ban-visitor")}
        >
          Ban visitor
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => setShowAction("translate-chat")}
        >
          Translate chat
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActionButton;
