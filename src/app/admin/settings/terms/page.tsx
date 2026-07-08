"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

export default function TermsSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States for Terms settings
  const [signupTermsEnabled, setSignupTermsEnabled] = useState(false);
  const [signupTermsContent, setSignupTermsContent] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setSignupTermsEnabled(data.terms?.signupTermsEnabled || false);
          setSignupTermsContent(data.terms?.signupTermsContent || "");
        } else {
          toast.error("Failed to load configuration settings.");
        }
      } catch (err: any) {
        toast.error("Failed to load settings configuration.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleUpdate = async () => {
    setSaving(true);
    const toastId = toast.loading("Updating Terms & Conditions settings...");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "terms",
          data: {
            signupTermsEnabled,
            signupTermsContent,
          },
        }),
      });
      if (res.ok) {
        toast.success("Terms & Conditions settings successfully saved!", {
          id: toastId,
        });
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Update operation failed.");
      }
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-xs text-foreground/50">
          Fetching site configuration...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 cursor-pointer"
          onClick={() => router.push("/admin/settings")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold tracking-tight capitalize flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Terms & Conditions Settings
          </h2>
          <p className="text-xs text-foreground/60">
            Configure terms of service required for new user and organizer registrations.
          </p>
        </div>
      </div>

      <Card className="border border-border bg-card shadow-none p-6 max-w-2xl">
        <div className="space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <input
              type="checkbox"
              id="signupTermsEnabled"
              checked={signupTermsEnabled}
              onChange={(e) => setSignupTermsEnabled(e.target.checked)}
              className="h-4 w-4 accent-primary rounded border-border cursor-pointer"
            />
            <Label
              htmlFor="signupTermsEnabled"
              className="text-xs font-semibold cursor-pointer text-foreground/80"
            >
              Require Terms Acceptance on Sign Up
            </Label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="signupTermsContent" className="text-xs font-semibold">
              Signup Terms & Conditions Content
            </Label>
            <textarea
              id="signupTermsContent"
              value={signupTermsContent}
              placeholder="Enter details of terms, service agreements, and privacy policy for signup..."
              onChange={(e) => setSignupTermsContent(e.target.value)}
              className="min-h-[250px] w-full bg-transparent border border-border rounded-md px-3 py-2.5 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-foreground/30 text-card-foreground text-xs font-light leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              className="cursor-pointer h-9 px-4 text-xs font-semibold"
              disabled={saving}
              onClick={handleUpdate}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              Terms Settings
            </Button>

            <Button
              onClick={() => router.push("/admin/settings")}
              variant="outline"
              className="border-border text-foreground hover:bg-foreground/5 h-9 px-4 text-xs font-semibold transition-all cursor-pointer"
            >
              Back
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
