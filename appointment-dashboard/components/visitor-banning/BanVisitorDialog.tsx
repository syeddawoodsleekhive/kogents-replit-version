"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Shield } from "lucide-react";
import { CustomDatePicker } from "./CustomDatePicker";
import type { BanReason } from "@/types/visitor";

interface BanVisitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ipAddress?: string;
  onBan: (banData: {
    ipAddress: string;
    reason: BanReason;
    customReason?: string;
    expiresAt?: Date;
    notes?: string;
  }) => void;
}

const banReasons: { value: BanReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "abuse", label: "Abuse" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "harassment", label: "Harassment" },
  { value: "violation_of_terms", label: "Terms Violation" },
  { value: "security_threat", label: "Security Threat" },
  { value: "repeated_violations", label: "Repeated Violations" },
  { value: "custom", label: "Custom Reason" },
];

export function BanVisitorDialog({
  open,
  onOpenChange,
  ipAddress = "",
  onBan,
}: BanVisitorDialogProps) {
  const [inputIpAddress, setInputIpAddress] = useState(ipAddress);
  const [ipError, setIpError] = useState("");
  const [reason, setReason] = useState<BanReason>("spam");
  const [customReason, setCustomReason] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [isPermanent, setIsPermanent] = useState(true);

  const isValidIPAddress = (ip: string): boolean => {
    // IPv4 regex
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    // IPv6 regex (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  };

  const handleIpChange = (value: string) => {
    setInputIpAddress(value);
    if (value && !isValidIPAddress(value)) {
      setIpError("Please enter a valid IP address");
    } else {
      setIpError("");
    }
  };

  const handleBan = () => {
    if (!inputIpAddress.trim()) {
      setIpError("IP address is required");
      return;
    }

    if (!isValidIPAddress(inputIpAddress)) {
      setIpError("Please enter a valid IP address");
      return;
    }

    onBan({
      ipAddress: inputIpAddress,
      reason,
      customReason: reason === "custom" ? customReason : undefined,
      expiresAt: isPermanent ? undefined : expiresAt,
      notes,
    });

    // Reset form
    setInputIpAddress("");
    setIpError("");
    setReason("spam");
    setCustomReason("");
    setExpiresAt(undefined);
    setNotes("");
    setIsPermanent(false);
    onOpenChange(false);
  };

  const isFormValid =
    inputIpAddress.trim() &&
    isValidIPAddress(inputIpAddress) &&
    (reason !== "custom" || customReason.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Ban IP Address
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Warning</p>
              <p className="text-yellow-700">
                Banning this IP address will prevent all visitors from this IP
                from starting new chats and accessing your website chat widget.
              </p>
            </div>
          </div>

          {/* IP Address */}
          <div className="space-y-2">
            <Label htmlFor="ipAddress">IP Address</Label>
            <Input
              id="ipAddress"
              value={inputIpAddress}
              onChange={(e) => handleIpChange(e.target.value)}
              placeholder="Enter IP address (e.g., 192.168.1.100)"
              className={ipError ? "border-red-500" : ""}
            />
            {ipError && <p className="text-sm text-red-500">{ipError}</p>}
          </div>

          {/* Ban Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Ban Reason</Label>
            <Select
              value={reason}
              onValueChange={(value: BanReason) => setReason(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {banReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason */}
          {reason === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Custom Reason</Label>
              <Input
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter custom ban reason"
              />
            </div>
          )}

          {/* Ban Duration */}
          <div className="space-y-3">
            <Label>Ban Duration</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="permanent"
                checked={isPermanent}
                onCheckedChange={(checked) =>
                  setIsPermanent(checked as boolean)
                }
              />
              <Label htmlFor="permanent" className="text-sm font-medium">
                Permanent ban
              </Label>
            </div>

            {!isPermanent && (
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                <CustomDatePicker
                  value={expiresAt}
                  onChange={setExpiresAt}
                  placeholder="Select expiration date"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any internal notes about this ban..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleBan}
            disabled={!isFormValid}
            className="bg-red-600 hover:bg-red-700"
          >
            Ban IP Address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
