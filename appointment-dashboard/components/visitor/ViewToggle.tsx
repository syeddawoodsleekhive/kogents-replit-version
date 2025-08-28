import { Button } from "@/components/ui/button";
import { Dispatch, SetStateAction } from "react";

interface ViewToggleProps {
  viewMode: "list" | "visual";
  setViewMode: Dispatch<SetStateAction<"list" | "visual">>;
}

export const ViewToggle = ({ viewMode, setViewMode }: ViewToggleProps) => (
  <div className="flex items-center space-x-2">
    <Button
      variant={viewMode === "list" ? "default" : "outline"}
      size="sm"
      onClick={() => setViewMode("list")}
      className="h-8 px-3"
    >
      List
    </Button>
    <Button
      variant={viewMode === "visual" ? "default" : "outline"}
      size="sm"
      onClick={() => setViewMode("visual")}
      className="h-8 px-3"
    >
      Visual
    </Button>
  </div>
);
