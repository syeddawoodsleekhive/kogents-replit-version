"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Copy, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ResponsesListSkeleton } from "../skeleton/response-list-skeleton";

interface ResponsesListProps {
  responses: CannedResponse[];
  categories: CannedResponseCategory[];
  selectedResponses: string[];
  onToggleSelection: (id: string) => void;
  onEdit: (response: CannedResponse) => void;
  onDelete: (response: CannedResponse) => void;
  loading: boolean;
}

export const ResponsesList = ({
  responses,
  categories,
  selectedResponses,
  onToggleSelection,
  onEdit,
  onDelete,
  loading,
}: ResponsesListProps) => {
  const { toast } = useToast();

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Response copied to clipboard",
    });
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(
      (c) => c.name.toLowerCase() === categoryName
    );
    return category?.color || "#6B7280";
  };

  if (loading) return <ResponsesListSkeleton />;

  // if (responses.length === 0) {
  //   return (
  //     <div className="text-center py-12">
  //       <div className="text-gray-400 mb-2">No responses found</div>
  //       <p className="text-sm text-gray-500">
  //         Create your first canned response to get started
  //       </p>
  //     </div>
  //   );
  // }

  return (
    <div className="grid gap-4">
      {responses.map((response) => (
        <Card key={response.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Checkbox
                  checked={selectedResponses.includes(response.id!)}
                  onCheckedChange={() => onToggleSelection(response.id!)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{response.title}</CardTitle>
                    {response.shortcut && (
                      <Badge variant="outline" className="text-xs">
                        /{response.shortcut}
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor:
                          getCategoryColor(response.category.color) + "20",
                        color: getCategoryColor(response.category.color),
                      }}
                    >
                      {response.category.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Used {response.usageCount || 0} times</span>
                    <span>
                      Created{" "}
                      {new Date(response.createdAt!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(response.content)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(response)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => onDelete(response)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-gray-700 mb-3 whitespace-pre-wrap">
              {response.content}
            </p>
            {response.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {response.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
