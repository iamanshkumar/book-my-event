"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TicketTier {
  id: number;
  tierName: string;
  availableSeats: number;
  pricePerSeatExcludingTax: string;
  taxPercentage: string;
}

interface Event {
  id: number;
  organizerId: number;
  eventName: string;
  description: string;
  location: string;
  dateTime: string;
  duration: string;
  thumbnail: string | null;
  banner: string | null;
  status: string;
  createdAt: string;
  ticketTiers: TicketTier[];
  organizer: {
    name: string;
  };
}

export default function AttendeeDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingState, setBookingState] = useState<Record<number, { tierId: number; quantity: number }>>({});

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/events/list");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load events.");
        }

        setEvents(data.events);

        // Initialize booking states
        const initialStates: Record<number, { tierId: number; quantity: number }> = {};
        data.events.forEach((event: Event) => {
          if (event.ticketTiers && event.ticketTiers.length > 0) {
            initialStates[event.id] = {
              tierId: event.ticketTiers[0].id,
              quantity: 1,
            };
          }
        });
        setBookingState(initialStates);
      } catch (err: any) {
        toast.error("Fetching events failed", {
          description: err.message,
        })
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const handleTierChange = (eventId: number, tierId: number) => {
    setBookingState((prev) => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        tierId,
        quantity: 1,
      },
    }));
  };

  const handleQuantityChange = (eventId: number, delta: number, maxSeats: number) => {
    setBookingState((prev) => {
      const current = prev[eventId] || { tierId: 0, quantity: 1 };
      const newQty = Math.max(1, Math.min(maxSeats, current.quantity + delta));
      return {
        ...prev,
        [eventId]: {
          ...current,
          quantity: newQty,
        },
      };
    });
  };

  const handleBookTicket = async (eventId: number) => {
    const booking = bookingState[eventId];
    if (!booking || !booking.tierId) {
      toast.error("Please select a ticket tier.");
      return;
    }

    const toastId = toast.loading("Processing ticket booking...");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketTierId: booking.tierId,
          quantity: booking.quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not check out.");
      }

      toast.dismiss(toastId);
      toast.success("Ticket booked successfully!");

      // Update seats remaining client side
      setEvents((prevEvents) =>
        prevEvents.map((event) => {
          if (event.id === eventId) {
            return {
              ...event,
              ticketTiers: event.ticketTiers.map((tier) => {
                if (tier.id === booking.tierId) {
                  return {
                    ...tier,
                    availableSeats: Math.max(0, tier.availableSeats - booking.quantity),
                  };
                }
                return tier;
              }),
            };
          }
          return event;
        })
      );

      // Reset quantity
      setBookingState((prev) => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          quantity: 1,
        },
      }));
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Booking failed", {
        description: err.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-foreground/40" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metric Summaries Header Canvas Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-border bg-card shadow-none rounded-lg p-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium uppercase tracking-wider text-foreground/60">Registered Events</span>
            <Ticket className="h-4 w-4 text-foreground/40" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">1</div>
          </CardContent>
        </Card>
      </div>

      {/* Primary Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Upcoming Events</h2>
          <p className="text-sm text-foreground/60 font-light">Explore, collaborate, and book your spots inside upcoming initiatives.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-2">
          {events.map((event) => {
            const currentBooking = bookingState[event.id];
            const selectedTier = event.ticketTiers.find((t) => t.id === currentBooking?.tierId);
            const availableSeats = selectedTier?.availableSeats ?? 0;

            return (
              <Card key={event.id} className="border border-border bg-card shadow-none rounded-lg flex flex-col justify-between">
                <CardHeader className="space-y-1.5">
                  <CardTitle className="text-lg font-semibold tracking-tight leading-snug">{event.eventName}</CardTitle>
                  <CardDescription className="text-sm font-light text-foreground/70 line-clamp-2">{event.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 text-xs font-normal">
                  <div className="space-y-2 text-foreground/60">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(event.dateTime).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {event.ticketTiers.length > 0 ? (
                    <div className="space-y-3 pt-3 border-t border-border/40">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Ticket Tier</label>
                        <select
                          value={currentBooking?.tierId || ""}
                          onChange={(e) => handleTierChange(event.id, parseInt(e.target.value, 10))}
                          className="w-full bg-background border border-border text-foreground text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        >
                          {event.ticketTiers.map((tier) => (
                            <option key={tier.id} value={tier.id}>
                              {tier.tierName} (₹{tier.pricePerSeatExcludingTax} • {tier.availableSeats} left)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Quantity</span>
                        <div className="flex items-center border border-border rounded-md overflow-hidden bg-background">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(event.id, -1, availableSeats)}
                            disabled={!currentBooking || currentBooking.quantity <= 1}
                            className="px-2 py-1 text-xs hover:bg-foreground/5 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-xs font-medium border-x border-border min-w-[2rem] text-center select-none">
                            {currentBooking?.quantity || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(event.id, 1, availableSeats)}
                            disabled={!currentBooking || currentBooking.quantity >= availableSeats}
                            className="px-2 py-1 text-xs hover:bg-foreground/5 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-border/40 text-center text-xs text-destructive">
                      No ticket tiers configured.
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-border/40 pt-4 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-foreground/50 uppercase tracking-wider font-semibold">Total Price</span>
                    <span className="text-sm font-semibold tracking-tight">
                      {selectedTier
                        ? `₹${(parseFloat(selectedTier.pricePerSeatExcludingTax) * (currentBooking?.quantity || 1)).toFixed(2)}`
                        : "N/A"}
                    </span>
                  </div>
                  <Button
                    onClick={() => handleBookTicket(event.id)}
                    disabled={event.ticketTiers.length === 0 || availableSeats <= 0}
                    className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 text-xs font-medium shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {availableSeats <= 0 ? "Sold Out" : "Book Access Pass"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}