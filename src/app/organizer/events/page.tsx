"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Loader2, 
  Plus, 
  Trash2, 
  Edit3, 
  Info,
  AlertTriangle,
  Layers
} from "lucide-react";
import { toast } from "sonner";

interface TicketTier {
  id: number;
  tierName: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeatExcludingTax: string;
  taxPercentage: string;
}

interface Event {
  id: number;
  eventName: string;
  description: string;
  location: string;
  dateTime: string;
  duration: string;
  status: string;
  ticketTiers: TicketTier[];
}

export default function EventCatalogPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch organizer's events
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("/api/organizer/events");
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to load events.");
        }
        setEvents(data.events || []);
      } catch (err: any) {
        toast.error("Error loading events", {
          description: err.message
        });
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  // Handle DELETE request to remove event listing
  const handleDeleteEvent = async (eventId: number) => {
    const confirmDelete = window.confirm("Are you sure you want to drop this event? This action will immediately remove the listing from all active catalogs.");
    if (!confirmDelete) return;

    const toastId = toast.loading("Removing event from active catalogs...");

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete event.");
      }

      toast.dismiss(toastId);
      toast.success("Event deleted successfully!");

      // Refresh events state by removing deleted event from array
      setEvents((prev) => prev.filter((event) => event.id !== eventId));

    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Failed to delete event", {
        description: err.message
      });
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Event Catalog</h2>
          <p className="text-sm text-foreground/60 font-light mt-0.5">
            Configure ticket tiers, monitor available seating, and modify active listings.
          </p>
        </div>

        <Button
          onClick={() => router.push("/organizer/events/create")}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-9.5 px-4 text-xs font-semibold rounded-lg shadow-sm transition-all gap-1.5 cursor-pointer w-fit"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Schedule New Event
        </Button>
      </div>

      {/* 2. Catalog Listings Grid */}
      {events.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl bg-card/30 space-y-4">
          <Layers className="h-8 w-8 text-foreground/20" />
          <div className="text-center">
            <h4 className="text-sm font-semibold">No Managed Events Found</h4>
            <p className="text-xs text-foreground/50 font-light mt-1 max-w-xs mx-auto">
              Your hosted event list is currently empty. Schedule a new event profile to publish passes.
            </p>
          </div>
          <Button
            onClick={() => router.push("/organizer/events/create")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            Schedule First Event
          </Button>
        </div>
      ) : (
        /* Events Grid Catalog */
        <div className="grid gap-6 md:grid-cols-2">
          {events.map((event) => (
            <Card 
              key={event.id} 
              className="border border-border bg-card shadow-none rounded-xl flex flex-col justify-between overflow-hidden relative"
            >
              {/* Card Header details */}
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-foreground/45">Event ID #{event.id}</span>
                    <CardTitle className="text-base font-bold tracking-tight line-clamp-1 leading-snug">
                      {event.eventName}
                    </CardTitle>
                    <CardDescription className="text-xs font-light text-foreground/60 line-clamp-1">
                      {event.description || "No description provided."}
                    </CardDescription>
                  </div>

                  <span className="text-[8px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm shrink-0 bg-primary/10 text-primary border border-primary/20">
                    {event.status}
                  </span>
                </div>
              </CardHeader>

              {/* Event details block (date, address, duration) */}
              <CardContent className="px-5 pb-4 space-y-4 text-xs text-foreground/75 font-light">
                <div className="grid grid-cols-2 gap-3 pt-2 pb-2.5 border-y border-border/40 text-[11px] bg-foreground/[0.005]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
                    <span>{new Date(event.dateTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
                    <span>{event.duration}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>

                {/* Ticket Tiers list */}
                <div className="space-y-2.5">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-foreground/50 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-foreground/45" /> Configured Ticket Tiers
                  </p>
                  
                  {event.ticketTiers.length > 0 ? (
                    <div className="grid gap-2">
                      {event.ticketTiers.map((tier) => (
                        <div 
                          key={tier.id} 
                          className="flex justify-between items-center bg-background/50 border border-border/40 p-2.5 rounded-lg"
                        >
                          <div>
                            <p className="font-semibold text-foreground/95">{tier.tierName}</p>
                            <p className="text-[9px] text-foreground/50 mt-0.5">Seating capacity: {tier.availableSeats} / {tier.totalSeats}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">₹{parseFloat(tier.pricePerSeatExcludingTax).toFixed(2)}</p>
                            {parseFloat(tier.taxPercentage) > 0 && (
                              <p className="text-[8px] text-foreground/45 mt-0.5">Tax: {tier.taxPercentage}%</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg text-[10px]">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Warning: No ticket tiers configured. Users will be unable to reserve seats.</span>
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Action buttons footer */}
              <CardFooter className="p-4 px-5 flex justify-end gap-2.5 mt-auto bg-foreground/[0.01] border-t border-border/40">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/organizer/events/edit/${event.id}`)}
                  className="h-8.5 border-border text-foreground hover:bg-foreground/5 rounded-md px-3.5 text-xs font-semibold transition-colors gap-1.5 cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Event
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteEvent(event.id)}
                  className="h-8.5 border-destructive/20 text-destructive hover:bg-destructive/10 rounded-md px-3.5 text-xs font-semibold transition-colors gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Event
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
