"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export const UserListSkeleton = () => {
  const rows = Array.from({ length: 6 });

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          {/* Search icon placeholder */}
          <div className="absolute left-2.5 top-2.5 h-4 w-4 rounded-full">
            <Skeleton />
          </div>
          {/* Search input placeholder */}
          <Skeleton className="pl-8 h-10 rounded-md w-full" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Filters button placeholder */}
          <Skeleton className="h-10 w-28 rounded-md" />
          {/* Add user button placeholder */}
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      {/* Filters panel */}
      <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-muted/20">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-10 rounded-md w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-10 rounded-md w-full" />
        </div>

        {/* Uncomment if needed */}
        {/* <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-10 rounded-md w-full" />
        </div> */}

        <div className="col-span-1 sm:col-span-3 flex justify-end">
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <Skeleton className="h-4 w-24 rounded-md" />
              </TableHead>
              {/* <TableHead>Role</TableHead> */}
              {/* <TableHead>Department</TableHead> */}
              <TableHead>
                <Skeleton className="h-4 w-20 rounded-md" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-24 rounded-md" />
              </TableHead>
              <TableHead className="text-right">
                <Skeleton className="h-4 w-12 rounded-md mx-auto" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((_, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {/* Avatar skeleton */}
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex flex-col gap-1 flex-1">
                      <Skeleton className="h-4 w-32 rounded-md" />
                      <Skeleton className="h-3 w-48 rounded-md" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-md" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24 rounded-md" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-8 rounded-md mx-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserListSkeleton;
