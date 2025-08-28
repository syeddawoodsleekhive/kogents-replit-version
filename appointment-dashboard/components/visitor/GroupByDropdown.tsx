import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface GroupByDropdownProps {
  groupBy: string;
  setGroupBy: Dispatch<SetStateAction<string>>;
}

export const GroupByDropdown = ({ groupBy, setGroupBy }: GroupByDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex justify-between w-48">
          <span>Group by {groupBy}</span>
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem 
          className={`${groupBy === "Activity" ? "bg-blue-500 text-white" : ""} focus:bg-blue-600 focus:text-white`}
          onClick={() => setGroupBy("Activity")}
        >
          Activity
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setGroupBy("Page title")}>
          Page title
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setGroupBy("Page URL")}>
          Page URL
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setGroupBy("Country")}>
          Country
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setGroupBy("Serving agent")}>
          Serving agent
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setGroupBy("Department")}>
          Department
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setGroupBy("Browser")}>
          Browser
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setGroupBy("Search engine")}>
          Search engine
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setGroupBy("Search term")}>
          Search term
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
