"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current user profile details
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load user profile.");
        }
        setName(data.user.name || "");
        setEmail(data.user.email || "");
      } catch (err: any) {
        toast.error("Failed to load profile", {
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name || !email) return;

    setSaving(true);
    const toastId = toast.loading("Updating profile details...");

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Update failed.");
      }

      toast.dismiss(toastId);
      toast.success("Profile updated successfully!");
      
      // Force page refresh or reload page to propagate name changes
      router.refresh();
      
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Profile update failed", {
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Profile Settings</h2>
        <p className="text-sm text-foreground/60 font-light mt-0.5">
          Manage your personal details and identity information on the platform.
        </p>
      </div>

      <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden p-2">
        <CardHeader className="space-y-1.5 border-b border-border/40 pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary h-12 w-12 rounded-full flex items-center justify-center border border-primary/20">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Account Information</CardTitle>
              <CardDescription className="text-xs font-light text-foreground/60">Update your account name and email address</CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium text-foreground/80">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10 bg-transparent border-border rounded-md px-3 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-foreground/80">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 bg-transparent border-border rounded-md px-3 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
              />
            </div>
          </CardContent>

          <CardFooter className="pt-4 pb-6 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 text-xs font-semibold rounded-md shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save Profile Changes"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
