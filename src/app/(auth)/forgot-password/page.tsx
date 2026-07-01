"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const toastId = toast.loading("Requesting password reset verification code...");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize password reset chain.");
      }

      toast.dismiss(toastId);
      toast.success("Verification code sent!", {
        description: "Please check your inbox for the 6-digit code."
      });

      // Save email in sessionStorage to pass to /verify-otp
      sessionStorage.setItem("reset_email", email);

      // Redirect to OTP verification screen
      router.push("/verify-otp");

    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Request failed", {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 font-sans selection:bg-black selection:text-white">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-sm border border-border bg-card p-2 rounded-lg shadow-sm">
        <CardHeader className="space-y-1.5 text-center pt-6">
          <CardTitle className="text-2xl font-semibold tracking-tight text-card-foreground">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-sm text-foreground/60">
            Enter your email below to receive a 6-digit verification code to reset your password.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-foreground/80">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 bg-transparent border-border rounded-md px-3 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
              />
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
                  Sending Code...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>

            <Button
              variant="link"
              type="button"
              onClick={() => router.push("/login")}
              className="p-0 text-xs text-foreground/60 hover:text-foreground font-normal h-auto py-0 transition-colors gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
