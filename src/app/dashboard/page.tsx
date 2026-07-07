"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Ticket, 
  Loader2, 
  CreditCard, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Clock, 
  AlertCircle 
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/backend/lib/currency";

interface Booking {
  id: number;
  quantity: number;
  totalPricePaid: string;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  createdAt: string;
  currency: string;
  event: {
    eventName: string;
    dateTime: string;
    location: string;
  };
  ticketTier: {
    tierName: string;
  };
}

export default function AttendeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // 1. Load user profile
        const userRes = await fetch("/api/auth/me");
        const userData = await userRes.json();
        if (!userRes.ok) {
          throw new Error(userData.error || "Failed to load profile.");
        }
        setUser(userData.user);

        // 2. Load bookings
        const bookingsRes = await fetch("/api/bookings");
        const bookingsData = await bookingsRes.json();
        if (!bookingsRes.ok) {
          throw new Error(bookingsData.error || "Failed to load bookings.");
        }
        setBookings(bookingsData.bookings || []);

      } catch (err: any) {
        toast.error("Dashboard failed to load", {
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Calculators
  const activeBookings = bookings.filter((b) => b.paymentStatus !== "FAILED");
  const totalTickets = activeBookings.reduce((sum, b) => sum + b.quantity, 0);
  const totalSpent = activeBookings
    .filter((b) => b.paymentStatus === "SUCCESS")
    .reduce((sum, b) => sum + parseFloat(b.totalPricePaid), 0);

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Welcoming Hero Banner */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border p-6 sm:p-8 rounded-xl shadow-xs">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Welcome back, {user?.name || "Customer"}!
        </h2>
        <p className="text-xs sm:text-sm text-foreground/60 font-light mt-1 max-w-xl leading-relaxed">
          Manage your reserved access passes, review receipts, and monitor status updates on all events you have booked.
        </p>
      </div>

      {/* 2. Metric Dashboard Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Bookings */}
        <Card className="border border-border bg-card shadow-xs rounded-xl p-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Total Orders</span>
            <Ticket className="h-4 w-4 text-foreground/30" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{bookings.length}</div>
            <p className="text-[10px] text-foreground/45 mt-0.5">Orders placed on system</p>
          </CardContent>
        </Card>

        {/* Tickets Booked */}
        <Card className="border border-border bg-card shadow-xs rounded-xl p-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Tickets Booked</span>
            <Ticket className="h-4 w-4 text-foreground/30" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{totalTickets}</div>
            <p className="text-[10px] text-foreground/45 mt-0.5">Seats reserved in total</p>
          </CardContent>
        </Card>

        {/* Total Expenditure */}
        <Card className="border border-border bg-card shadow-xs rounded-xl p-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">Total Investment</span>
            <CreditCard className="h-4 w-4 text-foreground/30" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{formatPrice(totalSpent, bookings[0]?.currency || "INR")}</div>
            <p className="text-[10px] text-foreground/45 mt-0.5">Successful payment value</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Ticket Purchase History Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Ticket Purchase History</h3>
          <p className="text-xs text-foreground/50 font-light mt-0.5">
            A comprehensive list of your past and active event tickets.
          </p>
        </div>

        {bookings.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-xl bg-card/30 space-y-4">
            <Ticket className="h-8 w-8 text-foreground/20" />
            <div className="text-center">
              <h4 className="text-sm font-semibold">No Ticket Purchases Found</h4>
              <p className="text-xs text-foreground/50 font-light mt-1">
                You haven't purchased any tickets yet. Start exploring active event lists to reserve seats.
              </p>
            </div>
            <Button
              onClick={() => router.push("/")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              Explore Events
            </Button>
          </div>
        ) : (
          /* Bookings History Grid */
          <div className="grid gap-4 sm:grid-cols-2">
            {bookings.map((booking) => {
              const statusColors = {
                SUCCESS: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
                PENDING: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
                FAILED: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
                REFUNDED: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20",
              };

              return (
                <Card 
                  key={booking.id} 
                  className="border border-border bg-card shadow-none rounded-xl flex flex-col justify-between overflow-hidden relative"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-foreground/40">Order #{booking.id}</span>
                        <CardTitle className="text-base font-bold tracking-tight line-clamp-1 leading-snug">
                          {booking.event.eventName}
                        </CardTitle>
                        <CardDescription className="text-xs font-light text-foreground/60">
                          {booking.ticketTier.tierName} Pass • Qty: {booking.quantity}
                        </CardDescription>
                      </div>

                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm shrink-0 ${statusColors[booking.paymentStatus]}`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="px-5 pb-4 space-y-2 text-xs text-foreground/70 font-light border-b border-border/40 bg-foreground/[0.005]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-foreground/40" />
                      <span>{new Date(booking.event.dateTime).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-foreground/40" />
                      <span className="line-clamp-1">{booking.event.location}</span>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 px-5 flex items-center justify-between mt-auto bg-foreground/[0.01]">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-foreground/45 uppercase tracking-wider font-semibold">Total Paid</span>
                      <span className="text-sm font-bold tracking-tight">{formatPrice(booking.totalPricePaid, booking.currency)}</span>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard/tickets/${booking.id}`)}
                      className="h-8 border-border text-foreground hover:bg-foreground/5 rounded-md px-3 text-xs font-semibold transition-colors gap-1.5 cursor-pointer"
                    >
                      View Receipt
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}