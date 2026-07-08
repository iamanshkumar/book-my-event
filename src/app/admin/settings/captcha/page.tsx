"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, ShieldCheck, Key } from "lucide-react";
import { toast } from "sonner";

export default function CaptchaSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States for dynamic captcha settings
  const [captchaTypeRegister, setCaptchaTypeRegister] = useState("NONE");
  const [captchaTypeForgotPassword, setCaptchaTypeForgotPassword] = useState("NONE");
  
  const [captchaV3SiteKey, setCaptchaV3SiteKey] = useState("");
  const [captchaV3SecretKey, setCaptchaV3SecretKey] = useState("");
  
  const [captchaV2CheckboxSiteKey, setCaptchaV2CheckboxSiteKey] = useState("");
  const [captchaV2CheckboxSecretKey, setCaptchaV2CheckboxSecretKey] = useState("");
  
  const [captchaV2InvisibleSiteKey, setCaptchaV2InvisibleSiteKey] = useState("");
  const [captchaV2InvisibleSecretKey, setCaptchaV2InvisibleSecretKey] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          const cap = data.captcha || {};
          setCaptchaTypeRegister(cap.captchaTypeRegister || "NONE");
          setCaptchaTypeForgotPassword(cap.captchaTypeForgotPassword || "NONE");
          
          setCaptchaV3SiteKey(cap.captchaV3SiteKey || "");
          setCaptchaV3SecretKey(cap.captchaV3SecretKey || "");
          
          setCaptchaV2CheckboxSiteKey(cap.captchaV2CheckboxSiteKey || "");
          setCaptchaV2CheckboxSecretKey(cap.captchaV2CheckboxSecretKey || "");
          
          setCaptchaV2InvisibleSiteKey(cap.captchaV2InvisibleSiteKey || "");
          setCaptchaV2InvisibleSecretKey(cap.captchaV2InvisibleSecretKey || "");
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
    const toastId = toast.loading("Updating reCAPTCHA configuration settings...");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "captcha",
          data: {
            captchaTypeRegister,
            captchaTypeForgotPassword,
            captchaV3SiteKey,
            captchaV3SecretKey,
            captchaV2CheckboxSiteKey,
            captchaV2CheckboxSecretKey,
            captchaV2InvisibleSiteKey,
            captchaV2InvisibleSecretKey,
          },
        }),
      });
      if (res.ok) {
        toast.success("reCAPTCHA settings successfully saved!", {
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
            <ShieldCheck className="h-5 w-5 text-primary" /> Google reCAPTCHA Settings
          </h2>
          <p className="text-xs text-foreground/60">
            Configure Google reCAPTCHA options and secure login/register portals.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left column: Form Enable/Disable Selectors */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-border bg-card shadow-none p-5 flex flex-col gap-4">
            <h3 className="font-bold text-sm border-b border-border/40 pb-2 flex items-center gap-2">
              Portal Toggles
            </h3>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground/80">
                Registration Page CAPTCHA
              </Label>
              <select
                value={captchaTypeRegister}
                onChange={(e) => setCaptchaTypeRegister(e.target.value)}
                className="w-full bg-background border border-border text-foreground text-xs rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="NONE">None (Disabled)</option>
                <option value="V3">reCAPTCHA v3 (Score-Based)</option>
                <option value="V2_CHECKBOX">reCAPTCHA v2 (Checkbox)</option>
                <option value="V2_INVISIBLE">reCAPTCHA v2 (Invisible)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground/80">
                Forgot Password CAPTCHA
              </Label>
              <select
                value={captchaTypeForgotPassword}
                onChange={(e) => setCaptchaTypeForgotPassword(e.target.value)}
                className="w-full bg-background border border-border text-foreground text-xs rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="NONE">None (Disabled)</option>
                <option value="V3">reCAPTCHA v3 (Score-Based)</option>
                <option value="V2_CHECKBOX">reCAPTCHA v2 (Checkbox)</option>
                <option value="V2_INVISIBLE">reCAPTCHA v2 (Invisible)</option>
              </select>
            </div>
          </Card>
        </div>

        {/* Right column: reCAPTCHA Keys Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border bg-card shadow-none p-6">
            <h3 className="font-bold text-sm border-b border-border/40 pb-3 flex items-center gap-2 mb-5">
              <Key className="h-4.5 w-4.5 text-primary" /> API Keys Configuration
            </h3>

            <div className="space-y-6">
              {/* Group 1: reCAPTCHA v3 */}
              <div className="space-y-3.5 p-4 border border-border/50 rounded-lg bg-foreground/[0.005]">
                <h4 className="text-xs font-bold text-primary tracking-wide uppercase">
                  reCAPTCHA v3 (Score-Based)
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-foreground/75">
                      v3 Site Key (Client)
                    </Label>
                    <Input
                      value={captchaV3SiteKey}
                      placeholder="Enter reCAPTCHA v3 Site Key"
                      onChange={(e) => setCaptchaV3SiteKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-foreground/75">
                      v3 Secret Key (Server)
                    </Label>
                    <Input
                      type="password"
                      value={captchaV3SecretKey}
                      placeholder="Enter reCAPTCHA v3 Secret Key"
                      onChange={(e) => setCaptchaV3SecretKey(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: reCAPTCHA v2 Checkbox */}
              <div className="space-y-3.5 p-4 border border-border/50 rounded-lg bg-foreground/[0.005]">
                <h4 className="text-xs font-bold text-primary tracking-wide uppercase">
                  reCAPTCHA v2 (Checkbox)
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-foreground/75">
                      v2 Checkbox Site Key (Client)
                    </Label>
                    <Input
                      value={captchaV2CheckboxSiteKey}
                      placeholder="Enter v2 Checkbox Site Key"
                      onChange={(e) => setCaptchaV2CheckboxSiteKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-foreground/75">
                      v2 Checkbox Secret Key (Server)
                    </Label>
                    <Input
                      type="password"
                      value={captchaV2CheckboxSecretKey}
                      placeholder="Enter v2 Checkbox Secret Key"
                      onChange={(e) => setCaptchaV2CheckboxSecretKey(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: reCAPTCHA v2 Invisible */}
              <div className="space-y-3.5 p-4 border border-border/50 rounded-lg bg-foreground/[0.005]">
                <h4 className="text-xs font-bold text-primary tracking-wide uppercase">
                  reCAPTCHA v2 (Invisible)
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-foreground/75">
                      v2 Invisible Site Key (Client)
                    </Label>
                    <Input
                      value={captchaV2InvisibleSiteKey}
                      placeholder="Enter v2 Invisible Site Key"
                      onChange={(e) => setCaptchaV2InvisibleSiteKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-foreground/75">
                      v2 Invisible Secret Key (Server)
                    </Label>
                    <Input
                      type="password"
                      value={captchaV2InvisibleSecretKey}
                      placeholder="Enter v2 Invisible Secret Key"
                      onChange={(e) => setCaptchaV2InvisibleSecretKey(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6 mt-6 border-t border-border/40">
              <Button
                className="cursor-pointer text-xs h-9 px-4 font-semibold"
                disabled={saving}
                onClick={handleUpdate}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save reCAPTCHA Keys
              </Button>

              <Button
                onClick={() => router.push("/admin/settings")}
                variant="outline"
                className="border-border text-foreground hover:bg-foreground/5 text-xs h-9 px-4 font-semibold transition-all cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
