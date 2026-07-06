"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CaptchaSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States for Captcha settings
  const [captchaEnabledRegister, setCaptchaEnabledRegister] = useState(false);
  const [captchaEnabledForgotPassword, setCaptchaEnabledForgotPassword] = useState(false);
  const [captchaSiteKey, setCaptchaSiteKey] = useState("");
  const [captchaSecretKey, setCaptchaSecretKey] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setCaptchaEnabledRegister(data.captcha.captchaEnabledRegister || false);
          setCaptchaEnabledForgotPassword(data.captcha.captchaEnabledForgotPassword || false);
          setCaptchaSiteKey(data.captcha.captchaSiteKey || "");
          setCaptchaSecretKey(data.captcha.captchaSecretKey || "");
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
    const toastId = toast.loading("Updating Captcha configuration settings...");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "captcha",
          data: {
            captchaEnabledRegister,
            captchaEnabledForgotPassword,
            captchaSiteKey,
            captchaSecretKey,
          },
        }),
      });
      if (res.ok) {
        toast.success("Captcha settings successfully saved!", {
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
          <h2 className="text-xl font-bold tracking-tight capitalize">
            Captcha Settings
          </h2>
          <p className="text-xs text-foreground/60">
            Configure Google reCAPTCHA site settings and protect entry portals.
          </p>
        </div>
      </div>

      <Card className="border border-border bg-card shadow-none p-6 max-w-2xl">
        <div className="space-y-4">
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="captchaEnabledRegister"
                checked={captchaEnabledRegister}
                onChange={(e) => setCaptchaEnabledRegister(e.target.checked)}
                className="h-4 w-4 accent-primary rounded border-border"
              />
              <Label
                htmlFor="captchaEnabledRegister"
                className="text-xs font-semibold cursor-pointer"
              >
                Enable reCAPTCHA on Registration Page
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="captchaEnabledForgotPassword"
                checked={captchaEnabledForgotPassword}
                onChange={(e) => setCaptchaEnabledForgotPassword(e.target.checked)}
                className="h-4 w-4 accent-primary rounded border-border"
              />
              <Label
                htmlFor="captchaEnabledForgotPassword"
                className="text-xs font-semibold cursor-pointer"
              >
                Enable reCAPTCHA on Forgot Password Page
              </Label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Google Recaptcha Site Key (Client)
            </Label>
            <Input
              value={captchaSiteKey}
              placeholder="Leave as 'MOCK' or empty to run local checkbox verification"
              onChange={(e) => setCaptchaSiteKey(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Google Recaptcha Secret Key (Server)
            </Label>
            <Input
              type="password"
              value={captchaSecretKey}
              placeholder="Enter Recaptcha Secret Key"
              onChange={(e) => setCaptchaSecretKey(e.target.value)}
            />
          </div>

          <Button
            className="mt-4 cursor-pointer"
            disabled={saving}
            onClick={handleUpdate}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            Captcha Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
