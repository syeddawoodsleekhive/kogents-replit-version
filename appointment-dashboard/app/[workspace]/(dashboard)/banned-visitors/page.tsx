"use client";

import { useEffect, useState } from "react";
import { BannedVisitorsList } from "@/components/visitor-banning/BannedVisitorsList";
import { BanVisitorDialog } from "@/components/visitor-banning/BanVisitorDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus } from "lucide-react";
import type { BannedVisitor } from "@/types/visitor";
import { useUser } from "@/context/UserContext";
import {
  createBan,
  deleteBan,
  fetchBans,
  toBannedVisitor,
  toBannedVisitorAPIData,
  updateBan,
} from "@/api/banned";

export default function BannedVisitorsPage() {
  const { toast } = useToast();
  const [bannedVisitors, setBannedVisitors] = useState<BannedVisitor[]>([]);
  const [showBanDialog, setShowBanDialog] = useState(false);

  const { workspace: workSpaceObj } = useUser();
  const workspace = workSpaceObj?._id;

  const handleUnban = (id: string) => {
    updateBan(id, { active: false })
      .then(() => {
        setBannedVisitors((prev) =>
          prev.map((visitor) =>
            visitor.id === id ? { ...visitor, isActive: false } : visitor
          )
        );

        toast({
          title: "IP address unbanned",
          description: "The IP address has been successfully unbanned.",
        });
      })
      .catch((err) => {
        toast({
          title: "Failed to unban IP address",
          description: "The IP address could not be unbanned.",
        });
      });
  };

  const handleEditBan = (id: string, updates: Partial<BannedVisitor>) => {
    const existingBan = bannedVisitors.find((ban) => ban.id === id);
    if (existingBan) {
      updateBan(
        id,
        toBannedVisitorAPIData({ ...existingBan, ...updates }, workspace)
      )
        .then(() => {
          setBannedVisitors((prev) =>
            prev.map((visitor) =>
              visitor.id === id ? { ...visitor, ...updates } : visitor
            )
          );

          toast({
            title: "Ban updated",
            description: "The ban has been successfully updated.",
          });
        })
        .catch((err) => {
          toast({
            title: "Failed to update ban",
            description: "The ban could not be updated.",
          });
        });
    } else {
      toast({
        title: "Ban not found",
        description: "The ban record could not be found.",
      });
    }
  };

  const handleDeleteBan = (id: string) => {
    deleteBan(id)
      .then(() => {
        setBannedVisitors((prev) =>
          prev.filter((visitor) => visitor.id !== id)
        );
        toast({
          title: "Ban Visitor deleted",
          description: "The ban record has been permanently deleted.",
        });
      })
      .catch((err) => {
        toast({
          title: "Failed to delete ban",
          description: "The ban record could not be deleted.",
        });
      });
  };

  useEffect(() => {
    if (!workspace) return;
    fetchBans(workspace).then((res) => {
      setBannedVisitors(res.data.data.map(toBannedVisitor));
    });
  }, [workspace]);

  const handleBanVisitor = (banData: {
    ipAddress: string;
    reason: any;
    customReason?: string;
    expiresAt?: Date;
    notes?: string;
  }) => {
    const newBan: BannedVisitor = {
      id: `ban-${Date.now()}`,
      visitorName: `IP: ${banData.ipAddress}`,
      ipAddress: banData.ipAddress,
      reason: banData.reason,
      customReason: banData.customReason,
      bannedBy: "Current User", // In real app, get from auth context
      bannedAt: new Date(),
      expiresAt: banData.expiresAt,
      isActive: true,
      isPermanent: !banData.expiresAt,
      notes: banData.notes,
    };

    createBan(toBannedVisitorAPIData(newBan, workspace))
      .then((res) => {
        setBannedVisitors((prev) => [...prev, toBannedVisitor(res.data.data)]);

        toast({
          title: "IP address banned",
          description: `IP address ${banData.ipAddress} has been successfully banned.`,
        });
      })
      .catch((err) => {
        toast({
          title:
            err?.response?.data?.errorDetails?.message || "Failed To Ban IP",
          description: `IP address ${banData.ipAddress} unable to be banned`,
        });
      });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-red-500" />
              Banned IP Addresses
            </h1>
            <p className="text-muted-foreground">
              Manage IP addresses that have been banned from your chat system
            </p>
          </div>
          <Button
            onClick={() => setShowBanDialog(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />
            Ban IP Address
          </Button>
        </div>
      </div>

      <BannedVisitorsList
        bannedVisitors={bannedVisitors}
        onUnban={handleUnban}
        onEditBan={handleEditBan}
        onDeleteBan={handleDeleteBan}
      />

      <BanVisitorDialog
        open={showBanDialog}
        onOpenChange={setShowBanDialog}
        onBan={handleBanVisitor}
      />
    </div>
  );
}
