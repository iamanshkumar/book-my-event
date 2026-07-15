"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

export default function GeneralSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [websiteTitle, setWebsiteTitle] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [websiteLogo, setWebsiteLogo] = useState("");
  const [heroHeading, setHeroHeading] = useState("");
  const [isDemoMode, setIsDemoMode] = useState("0");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setWebsiteTitle(data.general.websiteTitle || "");
          setMetaTitle(data.general.metaTitle || "");
          setMetaDescription(data.general.metaDescription || "");
          setWebsiteLogo(data.general.websiteLogo || "");
          setHeroHeading(data.general.heroHeading || "");
          setIsDemoMode(data.general.isDemoMode || "0");
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
    const toastId = toast.loading("Updating general configuration settings...");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "general",
          data: {
            websiteTitle,
            metaTitle,
            metaDescription,
            websiteLogo,
            heroHeading,
            isDemoMode,
          },
        }),
      });
      if (res.ok) {
        toast.success("General settings successfully saved!", {
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
            General Settings
          </h2>
          <p className="text-xs text-foreground/60">
            Configure branding details and apply updates below.
          </p>
        </div>
      </div>

      <Card className="border border-border bg-card shadow-none p-6 max-w-2xl">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Website Title (Branding Name)
            </Label>
            <Input
              value={websiteTitle}
              onChange={(e) => setWebsiteTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Website Meta Title (Browser Tab / SEO)
            </Label>
            <Input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Website Meta Description (SEO)
            </Label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
              placeholder="Find live shows, concerts, workshops, and theater events..."
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
            <Label className="text-xs font-semibold">Is Demo Mode</Label>
            <select
              value={isDemoMode}
              onChange={(e) => setIsDemoMode(e.target.value)}
              className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Website Brand Logo</Label>
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
            className="mt-4 cursor-pointer"
            disabled={saving}
            onClick={handleUpdate}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            General Settings
          </Button>

          <Button
            onClick={() => router.push("/admin/settings")}
            variant="outline"
            className="ml-2 border-border text-foreground hover:bg-foreground/5 text-xs font-semibold transition-all cursor-pointer"
          >
            Back
          </Button>
        </div>
      </Card>
    </div>
  );
}
