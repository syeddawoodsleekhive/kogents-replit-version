"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Search,
  MoreHorizontal,
  Shield,
  Clock,
  Ban,
  Users,
  Calendar,
  Trash2,
  Edit,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { EditBanDialog } from "./EditBanDialog";
import { BulkEditDialog } from "./BulkEditDialog";
import type { BannedVisitor, BanStats } from "@/types/visitor";

interface BannedVisitorsListProps {
  bannedVisitors: BannedVisitor[];
  onUnban: (id: string) => void;
  onEditBan: (id: string, updates: Partial<BannedVisitor>) => void;
  onDeleteBan: (id: string) => void;
}

export function BannedVisitorsList({
  bannedVisitors,
  onUnban,
  onEditBan,
  onDeleteBan,
}: BannedVisitorsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [selectedBans, setSelectedBans] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [banToDelete, setBanToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [banToEdit, setBanToEdit] = useState<BannedVisitor | null>(null);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);

  // Calculate stats
  const stats: BanStats = useMemo(() => {
    const total = bannedVisitors.length;
    const active = bannedVisitors.filter((ban) => ban.isActive).length;
    const expired = bannedVisitors.filter(
      (ban) => !ban.isActive && ban.expiresAt && ban.expiresAt < new Date()
    ).length;
    const permanent = bannedVisitors.filter((ban) => ban.isPermanent).length;
    const temporary = bannedVisitors.filter((ban) => !ban.isPermanent).length;

    return { total, active, expired, permanent, temporary };
  }, [bannedVisitors]);

  // Filter banned visitors
  const filteredBans = useMemo(() => {
    return bannedVisitors.filter((ban) => {
      const matchesSearch =
        ban.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ban.visitorEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ban.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && ban.isActive) ||
        (statusFilter === "expired" && !ban.isActive);

      const matchesReason =
        reasonFilter === "all" || ban.reason === reasonFilter;

      return matchesSearch && matchesStatus && matchesReason;
    });
  }, [bannedVisitors, searchTerm, statusFilter, reasonFilter]);

  const handleSelectAll = () => {
    if (selectedBans.length === filteredBans.length) {
      setSelectedBans([]);
    } else {
      setSelectedBans(filteredBans.map((ban) => ban.id));
    }
  };

  const handleSelectBan = (banId: string) => {
    setSelectedBans((prev) =>
      prev.includes(banId)
        ? prev.filter((id) => id !== banId)
        : [...prev, banId]
    );
  };

  const handleBulkUnban = () => {
    selectedBans.forEach((banId) => onUnban(banId));
    setSelectedBans([]);
  };

  const handleBulkEdit = (updates: Partial<BannedVisitor>) => {
    selectedBans.forEach((banId) => onEditBan(banId, updates));
    setSelectedBans([]);
  };

  const handleDeleteClick = (banId: string) => {
    setBanToDelete(banId);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (ban: BannedVisitor) => {
    setBanToEdit(ban);
    setEditDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (banToDelete) {
      onDeleteBan(banToDelete);
      setBanToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleEditSave = (updates: Partial<BannedVisitor>) => {
    if (banToEdit) {
      onEditBan(banToEdit.id, updates);
      setBanToEdit(null);
    }
    setEditDialogOpen(false);
  };

  const getBanStatusBadge = (ban: BannedVisitor) => {
    if (!ban.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (ban.isPermanent) {
      return <Badge variant="destructive">Permanent</Badge>;
    }

    if (ban.expiresAt && ban.expiresAt > new Date()) {
      return <Badge variant="outline">Temporary</Badge>;
    }

    if (!ban.expiresAt) {
      return <Badge variant="destructive">Permanent</Badge>;
    }

    return <Badge variant="secondary">Expired</Badge>;
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      spam: "Spam",
      abuse: "Abuse",
      inappropriate_content: "Inappropriate Content",
      harassment: "Harassment",
      violation_of_terms: "Terms Violation",
      security_threat: "Security Threat",
      repeated_violations: "Repeated Violations",
      custom: "Custom",
    };
    return reasonMap[reason] || reason;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bans</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.active}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permanent</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.permanent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temporary</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.temporary}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, or IP address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="abuse">Abuse</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="inappropriate_content">
                  Inappropriate Content
                </SelectItem>
                <SelectItem value="violation_of_terms">
                  Terms Violation
                </SelectItem>
                <SelectItem value="security_threat">Security Threat</SelectItem>
                <SelectItem value="repeated_violations">
                  Repeated Violations
                </SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedBans.length > 0 && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700">
                {selectedBans.length} ban{selectedBans.length > 1 ? "s" : ""}{" "}
                selected
              </span>
              <Button size="sm" variant="outline" onClick={handleBulkUnban}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Unban Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Bulk Edit
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="overflow-visible">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedBans.length === filteredBans.length &&
                        filteredBans.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Visitor IP</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Banned By</TableHead>
                  <TableHead>Banned At</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No banned visitors found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBans.map((ban) => (
                    <TableRow key={ban.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedBans.includes(ban.id)}
                          onCheckedChange={() => handleSelectBan(ban.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {ban.ipAddress || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {getReasonLabel(ban.reason)}
                          </div>
                          {ban.customReason && (
                            <div className="text-sm text-muted-foreground">
                              {ban.customReason}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getBanStatusBadge(ban)}</TableCell>
                      <TableCell>{ban.bannedBy}</TableCell>
                      <TableCell>
                        {format(ban.bannedAt, "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {ban.isPermanent ? (
                          <span className="text-muted-foreground">Never</span>
                        ) : ban.expiresAt ? (
                          format(ban.expiresAt, "MMM d, yyyy")
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50 bg-transparent"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="z-50 min-w-[160px]"
                          >
                            {ban.isActive && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUnban(ban.id);
                                }}
                                className="cursor-pointer"
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Unban
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setTimeout(() => {
                                  handleEditClick(ban);
                                }, 100);
                              }}
                              className="cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Ban
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setTimeout(() => {
                                  handleDeleteClick(ban.id);
                                }, 100);
                              }}
                              className="text-red-600 cursor-pointer hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={bulkEditDialogOpen}
        onOpenChange={setBulkEditDialogOpen}
        selectedCount={selectedBans.length}
        onBulkEdit={handleBulkEdit}
      />

      {/* Edit Ban Dialog */}
      {banToEdit && (
        <EditBanDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          bannedVisitor={banToEdit}
          onSave={handleEditSave}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ban Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this ban record? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
