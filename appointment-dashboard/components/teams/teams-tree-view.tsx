"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditTeamDialog } from "./edit-team-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, FolderTree } from "lucide-react";
import { useTeamContext } from "./team-context";

interface TeamsTreeViewProps {
  searchQuery?: string;
}

export function TeamsTreeView({ searchQuery = "" }: TeamsTreeViewProps) {
  const { teams, isLoading, deleteTeam } = useTeamContext();
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [filteredTree, setFilteredTree] = useState<any[]>([]);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTeamId, setEditTeamId] = useState<string | null>(null);

  // Filter teams based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTree(teams);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = teams.filter(
      (team) =>
        team.name.toLowerCase().includes(query) ||
        team.description?.toLowerCase().includes(query)
    );
    setFilteredTree(filtered);
  }, [teams, searchQuery]);

  const toggleTeam = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    setIsDeleting(true);
    try {
      await deleteTeam(teamToDelete);
    } catch (error) {
      console.error("Error deleting team:", error);
    } finally {
      setIsDeleting(false);
      setTeamToDelete(null);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4 ml-6" />
            <Skeleton className="h-8 w-2/3 ml-12" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-4/5 ml-6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (filteredTree.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted p-3">
            <FolderTree className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No teams found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search query"
              : "Get started by creating your first team"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="team-tree">
            {filteredTree.map((team) => {
              const isExpanded = expandedTeams.has(team.id);
              return (
                <div key={team.id} className="team-tree-item">
                  <div className="flex items-center p-2 rounded-md hover:bg-muted/50">
                    {team.agents && team.agents.length > 0 ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 mr-1"
                        onClick={() => toggleTeam(team.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <div className="w-7"></div>
                    )}
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: team.color || "#6366f1" }}
                    />

                    <div className="flex-1 font-medium">{team.name}</div>

                    <Badge variant="outline" className="mr-2 font-normal">
                      {team.memberCount}{" "}
                      {team.memberCount === 1 ? "member" : "members"}
                    </Badge>

                    {/* <div className="flex items-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditTeamId(team.id)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit {team.name}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setTeamToDelete(team.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete {team.name}</span>
                      </Button>
                    </div> */}
                  </div>
                  {isExpanded && team.agents?.length > 0 && (
                    <div className="pl-10">
                      {team.agents.map((agent: any) => (
                        <div key={agent.id} className="flex items-center py-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              agent.online ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          <span className="ml-2 text-muted-foreground">
                            {agent.name}
                          </span>
                          {agent.admin && (
                            <span className="ml-2 text-blue-600">Admin</span>
                          )}
                          <span className="ml-2 text-muted-foreground">
                            {agent.chats}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {editTeamId && (
        <EditTeamDialog
          teamId={editTeamId}
          onClose={() => setEditTeamId(null)}
        />
      )}

      <AlertDialog
        open={!!teamToDelete}
        onOpenChange={(open) => !open && setTeamToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              team and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
