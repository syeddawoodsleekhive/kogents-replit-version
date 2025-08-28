"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit } from "lucide-react"
import { CustomDatePicker } from "./CustomDatePicker"
import type { BannedVisitor, BanReason } from "@/types/visitor"

interface EditBanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bannedVisitor: BannedVisitor
  onSave: (updates: Partial<BannedVisitor>) => void
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
]

export function EditBanDialog({ open, onOpenChange, bannedVisitor, onSave }: EditBanDialogProps) {
  const [reason, setReason] = useState<BanReason>(bannedVisitor.reason)
  const [customReason, setCustomReason] = useState(bannedVisitor.customReason || "")
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(bannedVisitor.expiresAt)
  const [notes, setNotes] = useState(bannedVisitor.notes || "")
  const [isPermanent, setIsPermanent] = useState(bannedVisitor.isPermanent)
  const [isActive, setIsActive] = useState(bannedVisitor.isActive)

  useEffect(() => {
    setReason(bannedVisitor.reason)
    setCustomReason(bannedVisitor.customReason || "")
    setExpiresAt(bannedVisitor.expiresAt)
    setNotes(bannedVisitor.notes || "")
    setIsPermanent(bannedVisitor.isPermanent)
    setIsActive(bannedVisitor.isActive)
  }, [bannedVisitor])

  const handleSave = () => {
    onSave({
      reason,
      customReason: reason === "custom" ? customReason : undefined,
      expiresAt: isPermanent ? undefined : expiresAt,
      notes,
      isPermanent,
      isActive,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Ban
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Visitor Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">{bannedVisitor.ipAddress?.[0] || "?"}</span>
              </div>
              <div>
                <p className="font-medium">IP Address</p>
                <p className="text-sm text-muted-foreground">{bannedVisitor.ipAddress}</p>
              </div>
            </div>
          </div>

          {/* Ban Status */}
          <div className="flex items-center space-x-2">
            <Checkbox id="isActive" checked={isActive} onCheckedChange={(checked) => setIsActive(checked as boolean)} />
            <Label htmlFor="isActive" className="text-sm font-medium">
              Ban is active
            </Label>
          </div>

          {/* Ban Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Ban Reason</Label>
            <Select value={reason} onValueChange={(value: BanReason) => setReason(value)}>
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
                onCheckedChange={(checked) => setIsPermanent(checked as boolean)}
              />
              <Label htmlFor="permanent" className="text-sm font-medium">
                Permanent ban
              </Label>
            </div>

            {!isPermanent && (
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                <CustomDatePicker value={expiresAt} onChange={setExpiresAt} placeholder="Select expiration date" />
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
          <Button onClick={handleSave} disabled={reason === "custom" && !customReason.trim()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
