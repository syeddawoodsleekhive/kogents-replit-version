"use client";

import { UserList } from "@/components/user-management/user-list";
import { UserProvider } from "@/components/user-management/user-context";

export default function UsersPage() {
  return (
    <UserProvider>
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              User Management
            </h1>
            <p className="text-muted-foreground mt-2">
              View, add, edit, and manage user accounts and permissions.
            </p>
          </div>
          <UserList />
        </main>
      </div>
    </UserProvider>
  );
}
