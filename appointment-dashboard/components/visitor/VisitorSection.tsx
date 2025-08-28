import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Visitor } from "@/types/visitor";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VisitorSectionHeader } from "./VisitorSectionHeader";
import { VisitorRow } from "./VisitorRow";
import { Dispatch, SetStateAction } from "react";
import { cn } from "@/lib/utils";

interface VisitorSectionProps {
  title: string;
  visitors: visitorSessionDataType[];
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
  onVisitorClick: (roomId: string) => void;
  iconType?: "chat" | "eye" | "idle" | "incoming" | "away";
  showMessage?: boolean;
  showAgent?: boolean;
}

export const VisitorSection = ({
  title,
  visitors,
  expanded,
  setExpanded,
  onVisitorClick,
  iconType = "idle",
  showMessage = false,
  showAgent = false,
}: VisitorSectionProps) => (
  <Card className="border rounded-md shadow-sm">
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CardHeader className="p-0">
        <VisitorSectionHeader
          title={title}
          visitorCount={visitors.length}
          expanded={expanded}
          onExpandChange={setExpanded}
        />
      </CardHeader>
      <CollapsibleContent>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Visitor</TableHead>
                <TableHead>Online</TableHead>
                {showAgent && <TableHead>Served by</TableHead>}
                {showMessage && <TableHead>Message</TableHead>}
                <TableHead>Viewing</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead className="text-right">Visits</TableHead>
                <TableHead className="text-right">Chats</TableHead>
              </TableRow>
            </TableHeader>
            {visitors.map((visitor, index) => (
              <TableBody
                key={index}
                className={cn(
                  "hover:bg-gray-100",
                  index < visitors.length - 1 ? "border-b" : ""
                )}
              >
                <VisitorRow
                  visitor={visitor}
                  onClick={onVisitorClick}
                  iconType={iconType}
                  showMessage={showMessage}
                  showAgent={showAgent}
                />
              </TableBody>
            ))}
          </Table>
        </CardContent>
      </CollapsibleContent>
    </Collapsible>
  </Card>
);
