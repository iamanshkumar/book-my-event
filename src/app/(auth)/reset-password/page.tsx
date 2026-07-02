"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [mounted, setMounted] = useState(false);

  // Form Inputs State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Fetch credentials from sessionStorage on mount
  useEffect(() => {
    setMounted(true);
    const storedEmail = sessionStorage.getItem("reset_email");
    const storedCode = sessionStorage.getItem("reset_code");

    if (!storedEmail || !storedCode) {
      toast.error("Invalid reset session", {
        description: "Please restart the password reset process."
      });
      router.push("/forgot-password");
      return;
    }

    setEmail(storedEmail);
    setCode(storedCode);
  }, []);

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
        description: "Your password must be at least 6 characters long."
      });
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Updating password credentials...");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update password.");
      }

      toast.dismiss(toastId);
      toast.success("Password updated successfully!", {
        description: "Proceed to sign in with your new credentials."
      });

      // Clear the temporary reset credentials from sessionStorage
      sessionStorage.removeItem("reset_email");
      sessionStorage.removeItem("reset_code");

      // Redirect to login page
      router.push("/login");

    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Override failed", {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !email || !code) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 font-sans selection:bg-black selection:text-white relative">
      <div className="absolute top-6 left-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-xs font-semibold text-foreground/60 hover:text-foreground hover:bg-foreground/5 h-9 px-3 rounded-md transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-sm border border-border bg-card p-2 rounded-lg shadow-sm">
        <CardHeader className="space-y-1.5 text-center pt-6">
          <div className="mx-auto bg-primary/10 text-primary h-12 w-12 rounded-full flex items-center justify-center mb-2 border border-primary/20">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-card-foreground">
            Reset Password
          </CardTitle>
          <CardDescription className="text-sm text-foreground/60">
            Set a new password for the account <span className="font-semibold text-foreground">{email}</span>.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4">
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

            {/* Confirm Password */}
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

          <CardFooter className="flex flex-col space-y-4 pt-4 pb-6">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-md text-sm transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
