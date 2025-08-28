import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { VisitorSectionHeader } from "../visitor/VisitorSectionHeader";

const VisitorSkeleton = () => {
  const placeholderBoxRows = Array.from({ length: 1 });
  const placeholderRows = Array.from({ length: 1 });

  return placeholderBoxRows.map((_, index) => (
    <Card className="border rounded-md shadow-sm" key={index}>
      <Collapsible open>
        <CardHeader className="p-0">
          <div className="flex items-center justify-between px-4 py-2">
            <Skeleton className="h-6 w-32" /> {/* Section title skeleton */}
            <Skeleton className="h-4 w-12" />  {/* Number count skeleton */}
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <TableHead key={i}>
                      <Skeleton className="h-4 w-24" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              {placeholderRows.map((_, index) => (
                <TableBody
                  key={index}
                  className={`hover:bg-gray-100 ${
                    index < placeholderRows.length - 1 ? "border-b" : ""
                  }`}
                >
                  <TableRow>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <TableCell key={i} className={i >= 6 ? "text-right" : ""}>
                        <Skeleton
                          className={`h-4 ${i >= 6 ? "w-1/3 ml-auto" : "w-3/4"}`}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              ))}
            </Table>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  ));
};

export default VisitorSkeleton;
