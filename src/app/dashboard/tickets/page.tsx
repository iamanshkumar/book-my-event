"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, Loader2, QrCode, Clock } from "lucide-react";
import { toast } from "sonner";

interface Booking {
  id: number;
  paymentStatus: string;
  totalPricePaid: string;
  quantity: number;
  createdAt: string;
  event: {
    eventName: string;
    dateTime: string;
    location: string;
    duration: string;
  };
  ticketTier: {
    tierName: string;
  };
}

export default function MyTicketsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const response = await fetch("/api/bookings");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load tickets.");
        }

        setBookings(data.bookings || []);
      } catch (err: any) {
        toast.error("Fetching tickets failed", {
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-foreground/40" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">My Tickets</h2>
        <p className="text-sm text-foreground/60 font-light">
          Manage and view your upcoming event access passes.
        </p>
      </div>

      {/* Empty State Handle */}
      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] border border-dashed border-border rounded-lg bg-card/50 space-y-4">
          <Ticket className="h-10 w-10 text-foreground/30" />
          <div className="text-center">
            <h3 className="text-lg font-medium tracking-tight">No tickets found</h3>
            <p className="text-sm text-foreground/60 font-light">You haven't booked any events yet.</p>
          </div>
          <Button
            onClick={() => router.push("/dashboard")}
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-6 text-xs font-medium shadow-sm transition-colors"
          >
            Discover Events
          </Button>
        </div>
      ) : (
        /* Ticket Grid */
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 pt-2">
          {bookings.map((booking) => (
            <Card key={booking.id} className="border border-border bg-card shadow-none rounded-lg flex flex-col justify-between overflow-hidden relative">

              {/* Decorative side accent for the "Ticket" look */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-foreground"></div>

              <CardHeader className="space-y-1.5 pl-6">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold tracking-tight leading-snug">
                      {booking.event.eventName}
                    </CardTitle>
                    <CardDescription className="text-sm font-light text-foreground/70 mt-1">
                      {booking.ticketTier.tierName} Pass • Qty: {booking.quantity}
                    </CardDescription>
                  </div>
                  <span className="px-2.5 py-1 bg-primary text-primary-foreground text-[10px] uppercase font-bold tracking-wider rounded-sm">
                    {booking.paymentStatus}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pl-6 text-xs text-foreground/80 font-normal">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-foreground/60" />
                  <span>{new Date(booking.event.dateTime).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-foreground/60" />
                  <span>Duration: {booking.event.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-foreground/60" />
                  <span>{booking.event.location}</span>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-border/40 pt-4 pb-4 pl-6 mt-auto bg-foreground/5">
                <div className="flex flex-col">
                  <span className="text-[10px] text-foreground/50 uppercase tracking-wider font-semibold">Total Paid</span>
                  <span className="text-sm font-bold tracking-tight">₹{booking.totalPricePaid}</span>
                </div>
                <Button variant="outline" className="h-9 border-border text-foreground hover:bg-foreground/5 rounded-md px-4 text-xs font-medium transition-colors gap-2">
                  <QrCode className="h-4 w-4" />
                  View Pass
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}