"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  DollarSign, 
  Ticket, 
  Users, 
  Calendar,
  Activity,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

interface AdminMetrics {
  globalRevenue: number;
  globalTicketsSold: number;
  totalRegisteredUsers: number;
  totalEventsHosted: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to load dashboard metrics.");
        }
        setMetrics(data.metrics || null);
      } catch (err: any) {
        toast.error("Dashboard error", {
          description: err.message
        });
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header Title */}
      <div className="border-b border-border/40 pb-5">
        <h2 className="text-xl font-semibold tracking-tight">Admin Dashboard</h2>
        <p className="text-sm text-foreground/60 font-light mt-0.5">
          Overview of platform activity, ticket metrics, and global registry analytics.
        </p>
      </div>

      {/* 2. Key Metrics Summary Grid */}
      {metrics && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Revenue */}
          <Card className="border border-border bg-card shadow-xs rounded-xl relative overflow-hidden p-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Global Revenue</span>
              <div className="bg-primary/10 text-primary p-1.5 rounded-lg border border-primary/15 shrink-0">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-2xl font-bold tracking-tight text-foreground/95">
                ₹{parseFloat(metrics.globalRevenue.toString()).toFixed(2)}
              </h3>
              <p className="text-[10px] text-foreground/45 mt-1 font-light flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" /> Platform transaction turnover
              </p>
            </CardContent>
          </Card>

          {/* Tickets Sold */}
          <Card className="border border-border bg-card shadow-xs rounded-xl relative overflow-hidden p-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Tickets Sold</span>
              <div className="bg-primary/10 text-primary p-1.5 rounded-lg border border-primary/15 shrink-0">
                <Ticket className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-2xl font-bold tracking-tight text-foreground/95">
                {metrics.globalTicketsSold}
              </h3>
              <p className="text-[10px] text-foreground/45 mt-1 font-light">Total passes generated</p>
            </CardContent>
          </Card>

          {/* Registered Users */}
          <Card className="border border-border bg-card shadow-xs rounded-xl relative overflow-hidden p-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Registered Users</span>
              <div className="bg-primary/10 text-primary p-1.5 rounded-lg border border-primary/15 shrink-0">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-2xl font-bold tracking-tight text-foreground/95">
                {metrics.totalRegisteredUsers}
              </h3>
              <p className="text-[10px] text-foreground/45 mt-1 font-light">Accounts created</p>
            </CardContent>
          </Card>

          {/* Events Hosted */}
          <Card className="border border-border bg-card shadow-xs rounded-xl relative overflow-hidden p-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Events Hosted</span>
              <div className="bg-primary/10 text-primary p-1.5 rounded-lg border border-primary/15 shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-2xl font-bold tracking-tight text-foreground/95">
                {metrics.totalEventsHosted}
              </h3>
              <p className="text-[10px] text-foreground/45 mt-1 font-light">Listings created by hosts</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Rebuilt overview section with Platform Summary and Quick Navigation Actions */}
      {metrics && (
        <div className="grid gap-6 md:grid-cols-2 pt-2">
          {/* Platform Performance Summary */}
          <Card className="border border-border bg-card shadow-xs rounded-xl p-2">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs uppercase font-bold tracking-widest text-foreground/50 flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-foreground/45" /> Platform Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-xs text-foreground/75 font-light">
              <div className="bg-foreground/[0.01] border border-border/40 p-3 rounded-lg space-y-1">
                <span className="font-semibold text-foreground/90">Average Ticket Sales Price</span>
                <p className="text-foreground/60">
                  ₹{metrics.globalTicketsSold > 0 ? (metrics.globalRevenue / metrics.globalTicketsSold).toFixed(2) : "0.00"} per ticket
                </p>
              </div>
              <div className="bg-foreground/[0.01] border border-border/40 p-3 rounded-lg space-y-1">
                <span className="font-semibold text-foreground/90">Events Listing Density</span>
                <p className="text-foreground/60">
                  {metrics.totalRegisteredUsers > 0 ? (metrics.totalEventsHosted / metrics.totalRegisteredUsers).toFixed(2) : "0.00"} events hosted per registered user profile
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Administration Actions */}
          <Card className="border border-border bg-card shadow-xs rounded-xl p-2">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs uppercase font-bold tracking-widest text-foreground/50 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-foreground/45" /> Administrative Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              <p className="text-xs font-light text-foreground/60 leading-relaxed mb-1">
                Quickly jump to system administration screens to manage privilege configurations or audit active event profiles.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Button 
                  onClick={() => router.push("/admin/users")}
                  className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold h-9 rounded-lg transition-all cursor-pointer"
                >
                  Manage Users
                </Button>
                <Button 
                  onClick={() => router.push("/admin/events")}
                  variant="outline"
                  className="border-border text-foreground hover:bg-foreground/5 text-xs font-semibold h-9 rounded-lg transition-all cursor-pointer"
                >
                  Moderate Events
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
