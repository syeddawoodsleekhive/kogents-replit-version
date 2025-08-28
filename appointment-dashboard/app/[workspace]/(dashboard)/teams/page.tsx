"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DepartmentProvider } from "@/components/department-management/department-context";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TeamsTreeView } from "@/components/teams/teams-tree-view";

export default function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DepartmentProvider>
      <div className="container mx-auto py-6 space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
            <p className="text-muted-foreground">
              Manage your organization's Teams and hierarchical structure
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search departments..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="tree" className="w-full">
          {/* <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="tree">Hierarchy View</TabsTrigger>
          </TabsList> */}
          {/* <TabsContent value="list" className="mt-6">
            <DepartmentList searchQuery={searchQuery} />
          </TabsContent> */}
          <TabsContent value="tree" className="mt-6">
            <TeamsTreeView searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </div>
    </DepartmentProvider>
  );
}
