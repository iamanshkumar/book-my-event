"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Loader2, 
  Search, 
  MapPin, 
  Trash2, 
  ShieldAlert,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/backend/lib/currency";

interface TicketTier {
  id: number;
  tierName: string;
  availableSeats: number;
  pricePerSeatExcludingTax: string;
  taxPercentage: string;
}

interface Event {
  id: number;
  eventName: string;
  location: string;
  dateTime: string;
  duration: string;
  status: string;
  currency: string;
  organizer: {
    name: string;
  };
  ticketTiers: TicketTier[];
}

export default function EventModerationPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Load published events
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("/api/events/list");
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to load events.");
        }
        setEvents(data.events || []);
      } catch (err: any) {
        toast.error("Moderator error", {
          description: err.message
        });
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  // Force delete event moderation action
  const handleForceDelete = async (eventId: number, eventName: string) => {
    const confirmDelete = window.confirm(`WARNING: Are you sure you want to ADMINISTRATIVE FORCE DELETE "${eventName}"? This action will permanently drop the event listing and cancel all active seating records. This cannot be undone.`);
    if (!confirmDelete) return;

    const toastId = toast.loading(`Administrative force-deleting event: ${eventName}...`);

    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to complete force-deletion.");
      }

      toast.dismiss(toastId);
      toast.success("Event listings dropped successfully.");

      // Refresh local events list
      setEvents((prev) => prev.filter((e) => e.id !== eventId));

    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Failed to delete event", {
        description: err.message
      });
    }
  };

  // Filter logic: match query against name, location, and organizer
  const filteredEvents = events.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchName = e.eventName?.toLowerCase().includes(q);
    const matchLoc = e.location?.toLowerCase().includes(q);
    const matchOrg = e.organizer?.name?.toLowerCase().includes(q);
    return matchName || matchLoc || matchOrg;
  });

  // Calculate pricing range for event tier labels
  const getPriceRange = (tiers: TicketTier[], currency = "INR") => {
    if (!tiers || tiers.length === 0) return "N/A";
    const prices = tiers.map((t) => parseFloat(t.pricePerSeatExcludingTax));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max 
      ? formatPrice(min, currency) 
      : `${formatPrice(min, currency)} - ${formatPrice(max, currency)}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Event Moderation</h2>
        <p className="text-sm text-foreground/60 font-light mt-0.5">
          Moderate active published events. Perform administrative removals on listings violating guidelines.
        </p>
      </div>

      {/* Filters */}
      <div className="relative flex-grow flex items-center max-w-md">
        <Search className="absolute left-3 text-foreground/35 h-4 w-4 pointer-events-none" />
        <Input
          type="text"
          placeholder="Filter by event name, location, or host organizer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9.5 pl-9 bg-transparent border-border rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-ring text-sm w-full"
        />
      </div>

      {/* Moderation catalog list card */}
      <Card className="border border-border bg-card shadow-none rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="bg-foreground/[0.01] border-b border-border/40 text-[10px] uppercase font-bold tracking-wider text-foreground/50 select-none">
                  <th className="py-3.5 px-5">Event ID</th>
                  <th className="py-3.5 px-4">Event details</th>
                  <th className="py-3.5 px-4">Venue location</th>
                  <th className="py-3.5 px-4">Organizer / Host</th>
                  <th className="py-3.5 px-4">Pricing Range</th>
                  <th className="py-3.5 px-5 text-right">Moderation Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-xs font-light text-foreground/80">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-foreground/45 select-none font-normal">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-5 w-5 text-foreground/30" />
                        <span>No active event listings found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((e) => (
                    <tr key={e.id} className="hover:bg-foreground/[0.005] transition-colors">
                      {/* ID */}
                      <td className="py-4 px-5 font-mono text-[11px] text-foreground/50 font-medium">
                        #{e.id}
                      </td>

                      {/* Event details */}
                      <td className="py-4 px-4 font-normal">
                        <p className="font-semibold text-foreground leading-normal line-clamp-1">{e.eventName}</p>
                        <p className="text-[10px] text-foreground/45 mt-0.5 flex items-center gap-1.5 font-light">
                          <Calendar className="h-3.5 w-3.5 text-foreground/35" />
                          <span>{new Date(e.dateTime).toLocaleDateString()} ({e.duration})</span>
                        </p>
                      </td>

                      {/* Venue location */}
                      <td className="py-4 px-4 font-normal text-foreground/70 flex items-center gap-1.5 pt-5">
                        <MapPin className="h-3.5 w-3.5 text-foreground/35 shrink-0" />
                        <span className="line-clamp-1">{e.location}</span>
                      </td>

                      {/* Host */}
                      <td className="py-4 px-4 font-semibold text-foreground/85">
                        {e.organizer?.name || "System Host"}
                      </td>

                      {/* Price Range */}
                      <td className="py-4 px-4 font-semibold text-foreground/90">
                        {getPriceRange(e.ticketTiers, e.currency)}
                      </td>

                      {/* Force Delete removal */}
                      <td className="py-4 px-5 text-right shrink-0">
                        <Button
                          variant="ghost"
                          onClick={() => handleForceDelete(e.id, e.eventName)}
                          className="h-8 border-destructive/20 text-destructive hover:bg-destructive/10 rounded-md px-3 text-[11px] font-semibold transition-colors gap-1.5 cursor-pointer ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Force Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-border/30">
              {filteredEvents.length === 0 ? (
                <div className="py-16 text-center text-foreground/45 select-none font-normal">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-5 w-5 text-foreground/30" />
                    <span>No active event listings found.</span>
                  </div>
                </div>
              ) : (
                filteredEvents.map((e) => (
                  <div key={e.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-foreground/50 font-medium">#{e.id}</span>
                      <span className="font-semibold text-foreground/95 text-xs">{getPriceRange(e.ticketTiers, e.currency)}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground leading-snug">{e.eventName}</div>
                      <div className="text-[11px] text-foreground/60 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-foreground/35" />
                        <span>{new Date(e.dateTime).toLocaleDateString()} ({e.duration})</span>
                      </div>
                      <div className="text-[11px] text-foreground/60 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-foreground/35 shrink-0" />
                        <span className="line-clamp-1">{e.location}</span>
                      </div>
                      <div className="text-[11px] text-foreground/60">
                        Host: <span className="font-medium text-foreground">{e.organizer?.name || "System Host"}</span>
                      </div>
                    </div>
                    <div className="pt-1">
                      <Button
                        variant="ghost"
                        onClick={() => handleForceDelete(e.id, e.eventName)}
                        className="h-8 w-full border border-destructive/20 text-destructive hover:bg-destructive/10 rounded-md text-[11px] font-semibold transition-colors gap-1.5 cursor-pointer flex items-center justify-center"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Force Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
