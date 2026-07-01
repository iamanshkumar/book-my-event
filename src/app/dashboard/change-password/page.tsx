"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Password mismatch", {
        description: "Your new password and confirmation password do not match."
      });
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Weak password", {
        description: "Your new password must be at least 6 characters long."
      });
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Updating password credentials...");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update password.");
      }

      toast.dismiss(toastId);
      toast.success("Password updated successfully!");
      
      // Reset inputs
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Credential update failed", {
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Security Settings</h2>
        <p className="text-sm text-foreground/60 font-light mt-0.5">
          Manage your account password credentials and maintain your access secure.
        </p>
      </div>

      <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden p-2">
        <CardHeader className="space-y-1.5 border-b border-border/40 pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary h-12 w-12 rounded-full flex items-center justify-center border border-primary/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Change Password</CardTitle>
              <CardDescription className="text-xs font-light text-foreground/60">Choose a strong, unique password to secure your account</CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {/* Old Password */}
            <div className="space-y-1.5">
              <Label htmlFor="oldPassword" className="text-xs font-medium text-foreground/80">
                Current Password
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="oldPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="h-10 w-full bg-transparent border-border rounded-md pl-3 pr-10 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-foreground/40 hover:text-foreground transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 stroke-[1.5]" />
                  ) : (
                    <Eye className="h-4 w-4 stroke-[1.5]" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-medium text-foreground/80">
                New Password
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-10 w-full bg-transparent border-border rounded-md pl-3 pr-10 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-foreground/40 hover:text-foreground transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 stroke-[1.5]" />
                  ) : (
                    <Eye className="h-4 w-4 stroke-[1.5]" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-medium text-foreground/80">
                Confirm New Password
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-10 w-full bg-transparent border-border rounded-md pl-3 pr-10 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-foreground/40 hover:text-foreground transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 stroke-[1.5]" />
                  ) : (
                    <Eye className="h-4 w-4 stroke-[1.5]" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-4 pb-6 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 text-xs font-semibold rounded-md shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
