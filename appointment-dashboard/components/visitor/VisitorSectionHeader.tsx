import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface VisitorSectionHeaderProps {
  title: string;
  visitorCount?: number;
  expanded?: boolean;
  onExpandChange?: Dispatch<SetStateAction<boolean>>;
}

export const VisitorSectionHeader = ({
  title,
  visitorCount,
  expanded,
  onExpandChange,
}: VisitorSectionHeaderProps) => {
  
  const handleClick = () => {
    if (onExpandChange) {
      onExpandChange((prev) => !prev);
    }
  };

  return (
    <Button
      variant="ghost"
      className="w-full flex justify-between items-center p-4"
      onClick={handleClick}
      aria-expanded={expanded}
      type="button"
    >
      <div className="flex items-center">
        <ChevronDown
          className={`h-5 w-5 mr-2 transition-transform ${
            expanded ? "" : "rotate-[-90deg]"
          }`}
          aria-hidden="true"
        />
        {title}
      </div>
      <div>Visitors: {visitorCount}</div>
    </Button>
  );
};
