import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ChangeEvent } from "react";

interface SearchFilterProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const SearchFilter = ({ value, onChange }: SearchFilterProps) => (
  <div className="relative">
    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
    <Input
      value={value}
      onChange={onChange}
      placeholder="Search"
      className="pl-9 h-9 w-[200px]"
    />
  </div>
);
