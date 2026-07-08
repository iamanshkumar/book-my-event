"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Loader2, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function PublicTermsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [websiteTitle, setWebsiteTitle] = useState("BookMyEvent");
  const [websiteLogo, setWebsiteLogo] = useState<string | null>(null);
  const [signupTermsContent, setSignupTermsContent] = useState("");

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.websiteTitle) setWebsiteTitle(data.websiteTitle);
          setWebsiteLogo(data.websiteLogo || null);
          setSignupTermsContent(data.signupTermsContent || "No terms and conditions have been configured yet.");
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-foreground/50 font-light">Loading terms & conditions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            {websiteLogo ? (
              <img src={websiteLogo} alt={websiteTitle} className="h-6 w-6 object-contain rounded-sm" />
            ) : (
              <Calendar className="h-5 w-5 text-primary" />
            )}
            <span className="font-semibold tracking-tight text-lg">
              {websiteTitle}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-10 space-y-6">
        <Button
          variant="ghost"
          onClick={() => window.close()}
          className="h-8 text-xs text-foreground/60 hover:text-foreground hover:bg-foreground/5 px-2 -ml-2 rounded-md gap-1.5 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Close Tab
        </Button>

        <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden p-2">
          <CardHeader className="border-b border-border/40 pb-5 pt-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 text-primary p-2 w-fit rounded-lg border border-primary/20">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">
                  Terms & Conditions
                </CardTitle>
                <CardDescription className="text-xs text-foreground/45 mt-0.5">
                  Please read the following guidelines and user terms carefully.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pb-6 px-4">
            <div className="text-sm text-foreground/80 leading-relaxed font-light whitespace-pre-wrap max-h-[70vh] overflow-y-auto pr-1">
              {signupTermsContent}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
