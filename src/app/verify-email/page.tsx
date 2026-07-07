"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Verifying your organizer account...");

  useEffect(() => {
    if (!code) {
      setStatus("error");
      setMessage("Invalid request: No verification code provided.");
      return;
    }

    async function triggerVerification() {
      try {
        const res = await fetch(`/api/auth/verify-email?code=${code}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Account verified successfully!");
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("A server connection issue occurred. Please try again.");
      }
    }

    triggerVerification();
  }, [code, router]);

  return (
    <Card className="w-full max-w-md border border-border bg-card p-3 rounded-lg shadow-sm">
      <CardHeader className="text-center pt-6 space-y-2">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Account Verification
        </CardTitle>
        <CardDescription className="text-xs text-foreground/50">
          Validating your organizer credentials and onboarding permissions
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center p-6 space-y-6 text-center">
        {status === "loading" && (
          <div className="space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-sm font-light text-foreground/70">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Verified!</h3>
              <p className="text-xs font-light text-foreground/60">{message}</p>
            </div>
            <p className="text-[10px] text-foreground/40 pt-2">
              Redirecting to login...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 w-full">
            <XCircle className="h-12 w-12 text-rose-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">
                Verification Failed
              </h3>
              <p className="text-xs font-light text-foreground/60">{message}</p>
            </div>
            <Button
              onClick={() => router.push("/login")}
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs rounded-md w-full font-semibold cursor-pointer"
            >
              Go to Login
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 font-sans relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <Suspense
        fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
