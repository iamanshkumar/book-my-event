"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Loader2,
  Globe,
  Mail,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

type SettingsTab = "dashboard" | "general" | "smtp" | "captcha";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States for general settings
  const [websiteTitle, setWebsiteTitle] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [websiteLogo, setWebsiteLogo] = useState("");
  const [heroHeading, setHeroHeading] = useState("");

  // States for SMTP settings
  const [smtpServer, setSmtpServer] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpProtocol, setSmtpProtocol] = useState("TLS");

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
          setWebsiteTitle(data.general.websiteTitle || "");
          setMetaTitle(data.general.metaTitle || "");
          setWebsiteLogo(data.general.websiteLogo || "");
          setHeroHeading(data.general.heroHeading || "");

          setSmtpServer(data.smtp.smtpServer || "");
          setSmtpPort(data.smtp.smtpPort?.toString() || "587");
          setSmtpProtocol(data.smtp.smtpProtocol || "TLS");

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

  const handleUpdate = async (
    type: "general" | "smtp" | "captcha",
    data: any,
  ) => {
    setSaving(true);
    const toastId = toast.loading(`Updating ${type} configuration settings...`);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data }),
      });
      if (res.ok) {
        toast.success(`${type.toUpperCase()} settings successfully saved!`, {
          id: toastId,
        });
        setActiveTab("dashboard");
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "logo");

    const toastId = toast.loading("Uploading website brand logo...");
    try {
      const res = await fetch("/api/events/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setWebsiteLogo(data.url);
        toast.success("Logo uploaded successfully!", { id: toastId });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image.", { id: toastId });
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

  if (activeTab === "dashboard") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Website Settings</h2>
          <p className="text-xs text-foreground/60">
            Configure general branding, mail systems, and spam protection.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            className="border border-border bg-card shadow-none hover:border-primary/40 cursor-pointer transition-all p-5 flex flex-col gap-3"
            onClick={() => setActiveTab("general")}
          >
            <div className="bg-primary/10 text-primary p-3 w-fit rounded-lg border border-primary/20">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">General Settings</h3>
              <p className="text-[11px] text-foreground/50 mt-1">
                Website title, dynamic brand logo, and hero section headings.
              </p>
            </div>
          </Card>

          <Card
            className="border border-border bg-card shadow-none hover:border-primary/40 cursor-pointer transition-all p-5 flex flex-col gap-3"
            onClick={() => setActiveTab("smtp")}
          >
            <div className="bg-primary/10 text-primary p-3 w-fit rounded-lg border border-primary/20">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">SMTP Settings</h3>
              <p className="text-[11px] text-foreground/50 mt-1">
                Configure SMTP email server integrations, port selections, and
                encryption.
              </p>
            </div>
          </Card>

          <Card
            className="border border-border bg-card shadow-none hover:border-primary/40 cursor-pointer transition-all p-5 flex flex-col gap-3"
            onClick={() => setActiveTab("captcha")}
          >
            <div className="bg-primary/10 text-primary p-3 w-fit rounded-lg border border-primary/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Recaptcha Settings</h3>
              <p className="text-[11px] text-foreground/50 mt-1">
                Enable verification checks protecting register and recovery
                forms.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setActiveTab("dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold tracking-tight capitalize">
            {activeTab} Settings
          </h2>
          <p className="text-xs text-foreground/60">
            Configure configuration details and apply updates below.
          </p>
        </div>
      </div>

      <Card className="border border-border bg-card shadow-none p-6 max-w-2xl">
        {activeTab === "general" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Website Title (Branding Name)</Label>
              <Input
                value={websiteTitle}
                onChange={(e) => setWebsiteTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Website Meta Title (Browser Tab / SEO)</Label>
              <Input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Homepage Hero Heading
              </Label>
              <Input
                value={heroHeading}
                onChange={(e) => setHeroHeading(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Website Brand Logo
              </Label>
              <div className="flex items-center gap-4">
                {websiteLogo && (
                  <img
                    src={websiteLogo}
                    alt="Logo Preview"
                    className="h-10 w-auto object-contain border border-border p-1 bg-foreground/5 rounded-md"
                  />
                )}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-file-input"
                  />
                  <Button
                    asChild
                    variant="outline"
                    className="text-xs cursor-pointer"
                  >
                    <label
                      htmlFor="logo-file-input"
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-3.5 w-3.5" /> Select Logo File
                    </label>
                  </Button>
                </div>
              </div>
            </div>

            <Button
              className="mt-4"
              disabled={saving}
              onClick={() =>
                handleUpdate("general", {
                  websiteTitle,
                  metaTitle,
                  websiteLogo,
                  heroHeading,
                })
              }
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              General Settings
            </Button>
          </div>
        )}

        {activeTab === "smtp" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">SMTP Host Server</Label>
              <Input
                value={smtpServer}
                placeholder="e.g. smtp.mailgun.org"
                onChange={(e) => setSmtpServer(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">SMTP Server Port</Label>
              <Input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Encryption Protocol
              </Label>
              <select
                value={smtpProtocol}
                onChange={(e) => setSmtpProtocol(e.target.value)}
                className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="TLS">TLS (Port 587)</option>
                <option value="SSL">SSL (Port 465)</option>
                <option value="NONE">None (Port 25)</option>
              </select>
            </div>

            <Button
              className="mt-4"
              disabled={saving}
              onClick={() =>
                handleUpdate("smtp", { smtpServer, smtpPort, smtpProtocol })
              }
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              SMTP Settings
            </Button>
          </div>
        )}

        {activeTab === "captcha" && (
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
                  onChange={(e) =>
                    setCaptchaEnabledForgotPassword(e.target.checked)
                  }
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
              className="mt-4"
              disabled={saving}
              onClick={() =>
                handleUpdate("captcha", {
                  captchaEnabledRegister,
                  captchaEnabledForgotPassword,
                  captchaSiteKey,
                  captchaSecretKey,
                })
              }
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              Captcha Settings
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
