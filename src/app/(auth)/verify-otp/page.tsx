"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [mounted, setMounted] = useState(false);

  // 1. Fetch email from sessionStorage on mount
  useEffect(() => {
    setMounted(true);
    const storedEmail = sessionStorage.getItem("reset_email");
    if (!storedEmail) {
      toast.error("Invalid session", {
        description: "Please specify your email to request a reset code."
      });
      router.push("/forgot-password");
      return;
    }
    setEmail(storedEmail);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Invalid code", {
        description: "The verification code must be exactly 6 digits."
      });
      return;
    }

    // Save code in sessionStorage to carry over to /reset-password page
    sessionStorage.setItem("reset_code", code);

    toast.success("Verification successful!", {
      description: "Setup your new password to complete the reset process."
    });

    router.push("/reset-password");
  };

  if (!mounted || !email) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 font-sans selection:bg-black selection:text-white">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-sm border border-border bg-card p-2 rounded-lg shadow-sm">
        <CardHeader className="space-y-1.5 text-center pt-6">
          <div className="mx-auto bg-primary/10 text-primary h-12 w-12 rounded-full flex items-center justify-center mb-2 border border-primary/20">
            <KeyRound className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-card-foreground">
            Verify Code
          </CardTitle>
          <CardDescription className="text-sm text-foreground/60">
            We sent a 6-digit verification code to <span className="font-semibold text-foreground">{email}</span>. Enter it below to proceed.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5 text-center">
              <Label htmlFor="code" className="text-xs font-medium text-foreground/80 block text-left">
                Verification Code
              </Label>
              <Input
                id="code"
                type="text"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                className="h-12 text-center text-2xl font-mono tracking-[0.5em] pl-4 bg-transparent border-border rounded-md shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/20 text-card-foreground"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-4 pb-6">
            <Button
              type="submit"
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-md text-sm transition-colors shadow-sm cursor-pointer"
            >
              Verify Code
            </Button>

            <Button
              variant="link"
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="p-0 text-xs text-foreground/60 hover:text-foreground font-normal h-auto py-0 transition-colors gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Change Email
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
