"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Loader2, 
  Search, 
  ShieldAlert,
  Calendar,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: number;
  name: string;
  email: string;
  role: "CUSTOMER" | "ORGANIZER" | "ADMIN";
  createdAt: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch users from backend API
  const loadUsers = async (search = "") => {
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to retrieve user directory.");
      }
      setUsers(data.users || []);
    } catch (err: any) {
      toast.error("Error loading user directory", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounced Search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadUsers(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle role modification PATCH requests
  const handleRoleChange = async (userId: number, currentName: string, newRole: "CUSTOMER" | "ORGANIZER" | "ADMIN") => {
    const confirmChange = window.confirm(`Are you sure you want to alter the role privileges of "${currentName}" to ${newRole}?`);
    if (!confirmChange) {
      // Reload current values to reset drop down selection
      loadUsers(searchQuery);
      return;
    }

    const toastId = toast.loading(`Updating security privileges for ${currentName}...`);

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Role modification failed.");
      }

      toast.dismiss(toastId);
      toast.success("Security role updated successfully!");

      // Update local state dynamically
      setUsers((prev) => 
        prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user))
      );

    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Failed to alter role", {
        description: err.message
      });
      // Reset values
      loadUsers(searchQuery);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">User Management</h2>
        <p className="text-sm text-foreground/60 font-light mt-0.5">
          Audit user registry details, monitor creations, and override security role privileges.
        </p>
      </div>

      {/* Toolbar Search Filter */}
      <div className="relative flex-grow flex items-center max-w-md">
        <Search className="absolute left-3 text-foreground/35 h-4 w-4 pointer-events-none" />
        <Input
          type="text"
          placeholder="Search by full name or email address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9.5 pl-9 bg-transparent border-border rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-ring text-sm w-full"
        />
      </div>

      {/* User Directory Table Card */}
      <Card className="border border-border bg-card shadow-none rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="bg-foreground/[0.01] border-b border-border/40 text-[10px] uppercase font-bold tracking-wider text-foreground/50 select-none">
                  <th className="py-3.5 px-5">User ID</th>
                  <th className="py-3.5 px-4">Full Name</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-5 text-right">Access Role privileges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-xs font-light text-foreground/80">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-foreground/45 select-none font-normal">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-5 w-5 text-foreground/30" />
                        <span>No registered accounts found matching your query.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-foreground/[0.005] transition-colors">
                      {/* ID */}
                      <td className="py-4 px-5 font-mono text-[11px] text-foreground/50 font-medium">
                        #{u.id}
                      </td>

                      {/* Name */}
                      <td className="py-4 px-4 font-semibold text-foreground">
                        {u.name}
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4 font-normal text-foreground/70">
                        {u.email}
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-4 text-foreground/50 flex items-center gap-1.5 pt-4.5">
                        <Calendar className="h-3.5 w-3.5 text-foreground/35" />
                        <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                      </td>

                      {/* Role drop-down selectors */}
                      <td className="py-4 px-5 text-right shrink-0">
                        <div className="inline-block relative">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, u.name, e.target.value as any)}
                            className="bg-transparent border border-border/80 hover:border-border rounded-md px-2.5 py-1 text-xs text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer w-[120px]"
                          >
                            <option value="CUSTOMER">Customer</option>
                            <option value="ORGANIZER">Organizer</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-border/30">
              {users.length === 0 ? (
                <div className="py-16 text-center text-foreground/45 select-none font-normal">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-5 w-5 text-foreground/30" />
                    <span>No registered accounts found matching your query.</span>
                  </div>
                </div>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-foreground/50 font-medium">#{u.id}</span>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, u.name, e.target.value as any)}
                        className="bg-transparent border border-border/80 hover:border-border rounded-md px-2 py-1 text-[11px] text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer w-[100px]"
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="ORGANIZER">Organizer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground">{u.name}</div>
                      <div className="text-foreground/70 text-[11px] break-all">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-foreground/50">
                      <Calendar className="h-3.5 w-3.5 text-foreground/35" />
                      <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
