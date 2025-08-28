import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // assuming you have a Skeleton component
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const TagsCategoriesSkeleton = () => {
  return (
    <Tabs defaultValue="tags" className="space-y-6">
      <TabsList className="border border-gray-200">
        <TabsTrigger value="tags" disabled>
          <Skeleton className="w-20 h-6" />
        </TabsTrigger>
        <TabsTrigger value="categories" disabled>
          <Skeleton className="w-28 h-6" />
        </TabsTrigger>
      </TabsList>

      {/* Tags Tab Skeleton */}
      <TabsContent value="tags" className="space-y-6">
        <div className="flex items-center gap-4 border border-gray-200 rounded">
          <Skeleton className="relative flex-1 h-10 rounded" />
          <Skeleton className="w-48 h-10 rounded" />
        </div>

        <Card>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr>
                  {[...Array(5)].map((_, i) => (
                    <th key={i}>
                      <Skeleton className="w-20 h-5" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="py-3">
                        <Skeleton className="h-5 rounded" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Categories Tab Skeleton */}
      <TabsContent value="categories" className="space-y-6">
        <div className="flex justify-end">
          <Skeleton className="w-36 h-10 rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="w-24 h-6 rounded" />
                </div>
                <CardDescription>
                  <Skeleton className="w-40 h-4 rounded" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <Skeleton className="w-12 h-5 rounded" />
                  <Skeleton className="w-8 h-5 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};
