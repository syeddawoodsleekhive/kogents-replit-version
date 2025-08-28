"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DepartmentForm } from "./department-form"

interface AddDepartmentDialogProps {
  children: React.ReactNode
}

export function AddDepartmentDialog({ children }: AddDepartmentDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
        </DialogHeader>
        <DepartmentForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
