"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SmtpSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States for SMTP settings
  const [smtpServer, setSmtpServer] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpProtocol, setSmtpProtocol] = useState("TLS");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setSmtpServer(data.smtp.smtpServer || "");
          setSmtpPort(data.smtp.smtpPort?.toString() || "587");
          setSmtpProtocol(data.smtp.smtpProtocol || "TLS");
          setSmtpUser(data.smtp.smtpUser || "");
          setSmtpPassword(data.smtp.smtpPassword || "");
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
    const toastId = toast.loading("Updating SMTP configuration settings...");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "smtp",
          data: {
            smtpServer,
            smtpPort,
            smtpProtocol,
            smtpUser,
            smtpPassword,
          },
        }),
      });
      if (res.ok) {
        toast.success("SMTP settings successfully saved!", {
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
            SMTP Settings
          </h2>
          <p className="text-xs text-foreground/60">
            Configure SMTP email server integrations, port selections, and encryption.
          </p>
        </div>
      </div>

      <Card className="border border-border bg-card shadow-none p-6 max-w-2xl">
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

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">SMTP Username</Label>
            <Input
              value={smtpUser}
              placeholder="e.g. postmaster@yourdomain.com"
              onChange={(e) => setSmtpUser(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">SMTP Password</Label>
            <Input
              type="password"
              value={smtpPassword}
              placeholder="••••••••"
              onChange={(e) => setSmtpPassword(e.target.value)}
            />
          </div>

          <Button
            className="mt-4 cursor-pointer"
            disabled={saving}
            onClick={handleUpdate}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            SMTP Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
