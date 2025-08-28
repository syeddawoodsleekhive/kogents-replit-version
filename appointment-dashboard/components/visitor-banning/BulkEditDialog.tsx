"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Users } from "lucide-react"
import { CustomDatePicker } from "./CustomDatePicker"
import type { BanReason } from "@/types/visitor"

interface BulkEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  onBulkEdit: (updates: {
    reason?: BanReason
    customReason?: string
    expiresAt?: Date
    notes?: string
    isPermanent?: boolean
    isActive?: boolean
  }) => void
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

export function BulkEditDialog({ open, onOpenChange, selectedCount, onBulkEdit }: BulkEditDialogProps) {
  const [reason, setReason] = useState<BanReason | "">("")
  const [customReason, setCustomReason] = useState("")
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined)
  const [notes, setNotes] = useState("")
  const [isPermanent, setIsPermanent] = useState<boolean | undefined>(undefined)
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined)

  // Track which fields should be updated
  const [updateReason, setUpdateReason] = useState(false)
  const [updateDuration, setUpdateDuration] = useState(false)
  const [updateNotes, setUpdateNotes] = useState(false)
  const [updateStatus, setUpdateStatus] = useState(false)

  const handleSave = () => {
    const updates: any = {}

    if (updateReason && reason) {
      updates.reason = reason
      if (reason === "custom" && customReason.trim()) {
        updates.customReason = customReason
      }
    }

    if (updateDuration) {
      updates.isPermanent = isPermanent
      if (!isPermanent) {
        updates.expiresAt = expiresAt
      }
    }

    if (updateNotes) {
      updates.notes = notes
    }

    if (updateStatus && isActive !== undefined) {
      updates.isActive = isActive
    }

    onBulkEdit(updates)
    handleReset()
    onOpenChange(false)
  }

  const handleReset = () => {
    setReason("")
    setCustomReason("")
    setExpiresAt(undefined)
    setNotes("")
    setIsPermanent(undefined)
    setIsActive(undefined)
    setUpdateReason(false)
    setUpdateDuration(false)
    setUpdateNotes(false)
    setUpdateStatus(false)
  }

  const isFormValid = () => {
    if (!updateReason && !updateDuration && !updateNotes && !updateStatus) {
      return false
    }

    if (updateReason && (!reason || (reason === "custom" && !customReason.trim()))) {
      return false
    }

    return true
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Bulk Edit Bans
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Count */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Bulk Edit</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCount} ban{selectedCount > 1 ? "s" : ""} selected for editing
                </p>
              </div>
            </div>
          </div>

          {/* Ban Status */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateStatus"
                checked={updateStatus}
                onCheckedChange={(checked) => setUpdateStatus(checked as boolean)}
              />
              <Label htmlFor="updateStatus" className="text-sm font-medium">
                Update ban status
              </Label>
            </div>

            {updateStatus && (
              <div className="ml-6 space-y-2">
                <Label>Ban Status</Label>
                <Select
                  value={isActive === undefined ? "" : isActive ? "active" : "inactive"}
                  onValueChange={(value) => setIsActive(value === "active")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Ban Reason */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateReason"
                checked={updateReason}
                onCheckedChange={(checked) => setUpdateReason(checked as boolean)}
              />
              <Label htmlFor="updateReason" className="text-sm font-medium">
                Update ban reason
              </Label>
            </div>

            {updateReason && (
              <div className="ml-6 space-y-3">
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

                {reason === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="customReason">Custom Reason</Label>
                    <input
                      id="customReason"
                      type="text"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Enter custom ban reason"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ban Duration */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateDuration"
                checked={updateDuration}
                onCheckedChange={(checked) => setUpdateDuration(checked as boolean)}
              />
              <Label htmlFor="updateDuration" className="text-sm font-medium">
                Update ban duration
              </Label>
            </div>

            {updateDuration && (
              <div className="ml-6 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="permanent"
                    checked={isPermanent === true}
                    onCheckedChange={(checked) => setIsPermanent(checked as boolean)}
                  />
                  <Label htmlFor="permanent" className="text-sm font-medium">
                    Permanent ban
                  </Label>
                </div>

                {isPermanent === false && (
                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                    <CustomDatePicker value={expiresAt} onChange={setExpiresAt} placeholder="Select expiration date" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateNotes"
                checked={updateNotes}
                onCheckedChange={(checked) => setUpdateNotes(checked as boolean)}
              />
              <Label htmlFor="updateNotes" className="text-sm font-medium">
                Update internal notes
              </Label>
            </div>

            {updateNotes && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any internal notes about these bans..."
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid()}>
            Update {selectedCount} Ban{selectedCount > 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
