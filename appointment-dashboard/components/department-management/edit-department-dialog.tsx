"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DepartmentForm } from "./department-form";

interface EditDepartmentDialogProps {
  departmentId: string;
  children: React.ReactNode;
}

export function EditDepartmentDialog({
  departmentId,
  children,
}: EditDepartmentDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  const onClickHandler = () => {
    setTimeout(() => setOpen((prev) => !prev), 10);
  };

  return (
    <Dialog open={open} onOpenChange={onClickHandler}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
        </DialogHeader>
        <DepartmentForm departmentId={departmentId} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
