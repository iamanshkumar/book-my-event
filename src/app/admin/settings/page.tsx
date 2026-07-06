"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Globe, Mail, ShieldCheck } from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();

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
          onClick={() => router.push("/admin/settings/general")}
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
          onClick={() => router.push("/admin/settings/smtp")}
        >
          <div className="bg-primary/10 text-primary p-3 w-fit rounded-lg border border-primary/20">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">SMTP Settings</h3>
            <p className="text-[11px] text-foreground/50 mt-1">
              Configure SMTP email server integrations, port selections, and encryption.
            </p>
          </div>
        </Card>

        <Card
          className="border border-border bg-card shadow-none hover:border-primary/40 cursor-pointer transition-all p-5 flex flex-col gap-3"
          onClick={() => router.push("/admin/settings/captcha")}
        >
          <div className="bg-primary/10 text-primary p-3 w-fit rounded-lg border border-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Recaptcha Settings</h3>
            <p className="text-[11px] text-foreground/50 mt-1">
              Enable verification checks protecting register and recovery forms.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
