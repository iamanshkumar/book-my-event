"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Loader2, 
  CreditCard, 
  Layers, 
  Calendar, 
  Users, 
  TrendingUp, 
  ArrowRight,
  Edit3
} from "lucide-react";
import { toast } from "sonner";

interface EventOverview {
  eventId: number;
  eventName: string;
  status: string;
  dateTime: string;
  revenue: number;
  ticketsSold: number;
  totalCapacity: number;
  fillRatePercentage: number;
}

interface Metrics {
  overview: {
    totalRevenue: number;
    totalTicketsSold: number;
    totalEventsPublished: number;
    globalFillRatePercentage: number;
  };
  eventsList: EventOverview[];
}

export default function OrganizerDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch("/api/organizer/dashboard");
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to load dashboard metrics.");
        }
        setMetrics(data.metrics);
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

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-foreground/50 font-light">Failed to retrieve metrics logs.</p>
      </div>
    );
  }

  const { overview, eventsList } = metrics;

  return (
    <div className="space-y-8">
      {/* 1. Dashboard Heading */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Metrics Dashboard</h2>
        <p className="text-sm text-foreground/60 font-light mt-0.5">
          Real-time summary analytics tracking seat capacity sales and event status listings.
        </p>
      </div>

      {/* 2. Overview Stats Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="border border-border bg-card shadow-xs rounded-xl p-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Total Revenue</span>
            <CreditCard className="h-4 w-4 text-foreground/30" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">₹{overview.totalRevenue.toFixed(2)}</div>
            <p className="text-[10px] text-foreground/45 mt-0.5">Gross receipts earned</p>
          </CardContent>
        </Card>

        {/* Tickets Sold */}
        <Card className="border border-border bg-card shadow-xs rounded-xl p-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Tickets Sold</span>
            <Users className="h-4 w-4 text-foreground/30" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{overview.totalTicketsSold}</div>
            <p className="text-[10px] text-foreground/45 mt-0.5">Total tickets checked out</p>
          </CardContent>
        </Card>

        {/* Published Events */}
        <Card className="border border-border bg-card shadow-xs rounded-xl p-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Events Hosted</span>
            <Layers className="h-4 w-4 text-foreground/30" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{overview.totalEventsPublished}</div>
            <p className="text-[10px] text-foreground/45 mt-0.5">Active profiles listed</p>
          </CardContent>
        </Card>

        {/* Avg Fill Rate */}
        <Card className="border border-border bg-card shadow-xs rounded-xl p-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Global Fill Rate</span>
            <TrendingUp className="h-4 w-4 text-foreground/30" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold tracking-tight">{overview.globalFillRatePercentage}%</div>
            
            {/* Tiny progress visual */}
            <div className="w-full bg-foreground/5 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${overview.globalFillRatePercentage}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Managed Events Overview Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold tracking-tight">Hosted Events Overview</h3>

        {eventsList.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-xl bg-card/30 space-y-4">
            <BarChart3 className="h-8 w-8 text-foreground/20" />
            <div className="text-center">
              <h4 className="text-sm font-semibold">No Managed Events</h4>
              <p className="text-xs text-foreground/50 font-light mt-1">
                You haven't created any event schedules yet.
              </p>
            </div>
            <Button
              onClick={() => router.push("/organizer/events/create")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              Schedule New Event
            </Button>
          </div>
        ) : (
          /* Events Grid Feed */
          <div className="grid gap-4 sm:grid-cols-2">
            {eventsList.map((event) => (
              <Card 
                key={event.eventId} 
                className="border border-border bg-card shadow-none rounded-xl flex flex-col justify-between overflow-hidden relative"
              >
                {/* Header info */}
                <CardHeader className="p-5 pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-foreground/40">Event ID #{event.eventId}</span>
                      <CardTitle className="text-base font-bold tracking-tight line-clamp-1 leading-snug">
                        {event.eventName}
                      </CardTitle>
                      <CardDescription className="text-xs font-light text-foreground/60 flex items-center gap-1">
                        <Calendar className="h-3 w-3 inline shrink-0" />
                        {new Date(event.dateTime).toLocaleDateString()}
                      </CardDescription>
                    </div>

                    <span className="text-[8px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm shrink-0 bg-primary/10 text-primary border border-primary/20">
                      {event.status}
                    </span>
                  </div>
                </CardHeader>

                {/* Sales breakdown stats */}
                <CardContent className="px-5 pb-4 space-y-3.5 bg-foreground/[0.005] border-y border-border/40 text-xs">
                  {/* Revenue Row */}
                  <div className="flex justify-between items-center text-foreground/75 font-light">
                    <span>Revenue:</span>
                    <span className="font-semibold text-foreground">₹{event.revenue.toFixed(2)}</span>
                  </div>

                  {/* Seat count */}
                  <div className="flex justify-between items-center text-foreground/75 font-light">
                    <span>Passes Sold:</span>
                    <span className="font-semibold text-foreground">{event.ticketsSold} / {event.totalCapacity}</span>
                  </div>

                  {/* Fill rate progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-foreground/50">
                      <span>Fill Rate:</span>
                      <span className="font-semibold">{event.fillRatePercentage}%</span>
                    </div>
                    <div className="w-full bg-foreground/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${event.fillRatePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>

                {/* Edit Action footer */}
                <CardFooter className="p-4 px-5 flex justify-end mt-auto bg-foreground/[0.01]">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/organizer/events/edit/${event.eventId}`)}
                    className="h-8 border-border text-foreground hover:bg-foreground/5 rounded-md px-3 text-xs font-semibold transition-colors gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Event Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
