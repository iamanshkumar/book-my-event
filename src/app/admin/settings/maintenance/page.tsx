"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Wrench } from "lucide-react";
import { toast } from "sonner";

export default function MaintenanceSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Maintenance Settings State variables
  const [maintenanceModeEnabled, setMaintenanceModeEnabled] = useState("0");
  const [maintenanceContent, setMaintenanceContent] = useState("");
  const [maintenanceAllowedIps, setMaintenanceAllowedIps] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.maintenance) {
            setMaintenanceModeEnabled(data.maintenance.maintenanceModeEnabled || "0");
            setMaintenanceContent(data.maintenance.maintenanceContent || "");
            setMaintenanceAllowedIps(data.maintenance.maintenanceAllowedIps || "");
          }
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
    const toastId = toast.loading("Updating maintenance mode configuration...");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "maintenance",
          data: {
            maintenanceModeEnabled,
            maintenanceContent,
            maintenanceAllowedIps,
          },
        }),
      });
      if (res.ok) {
        toast.success("Maintenance settings successfully saved!", {
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
            <Wrench className="h-5 w-5 text-primary" /> Maintenance Mode Settings
          </h2>
          <p className="text-xs text-foreground/60">
            Configure system downtime, custom block content, and IP address exception lists.
          </p>
        </div>
      </div>

      <Card className="border border-border bg-card shadow-none p-6 max-w-2xl">
        <div className="space-y-5">
          {/* Is Maintenance Mode Enabled Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Is Maintenance Mode
            </Label>
            <Select value={maintenanceModeEnabled} onValueChange={setMaintenanceModeEnabled}>
              <SelectTrigger className="h-10 bg-transparent border-border text-card-foreground">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-card-foreground">
                <SelectItem value="1">Yes (Active)</SelectItem>
                <SelectItem value="0">No (Inactive)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Maintenance Message content */}
          <div className="space-y-1.5">
            <Label htmlFor="maintenanceContent" className="text-xs font-semibold">
              Maintenance Content / Banner Message
            </Label>
            <textarea
              id="maintenanceContent"
              value={maintenanceContent}
              placeholder="Provide a status page explanation message for visitors..."
              onChange={(e) => setMaintenanceContent(e.target.value)}
              className="min-h-[140px] w-full bg-transparent border border-border rounded-md px-3 py-2.5 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-foreground/30 text-card-foreground text-xs font-light leading-relaxed"
            />
          </div>

          {/* Allowed IP exceptions textbox */}
          <div className="space-y-1.5">
            <Label htmlFor="maintenanceAllowedIps" className="text-xs font-semibold">
              Allowed IP Addresses (Bypass Exception List)
            </Label>
            <Input
              id="maintenanceAllowedIps"
              type="text"
              placeholder="e.g. 192.168.1.1, 203.0.113.10, 10.0.0.5"
              value={maintenanceAllowedIps}
              onChange={(e) => setMaintenanceAllowedIps(e.target.value)}
              className="h-10 bg-transparent border-border rounded-md px-3 shadow-none text-card-foreground text-xs"
            />
            <p className="text-[10px] text-foreground/40 font-light leading-relaxed">
              Enter one or more IP addresses separated by commas. Users connecting from these IPs can access the site normally. Leave blank to block everyone.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              className="cursor-pointer h-9 px-4 text-xs font-semibold"
              disabled={saving}
              onClick={handleUpdate}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Settings
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
