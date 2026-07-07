"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Ticket, 
  Loader2, 
  Search, 
  Calendar, 
  Filter,
  DollarSign,
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
  };
  ticketTier: {
    tierName: string;
  };
  user: {
    name: string;
    email: string;
  };
}

export default function RegistrationLogPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await fetch("/api/organizer/bookings");
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to load bookings.");
        }
        setBookings(data.bookings || []);
      } catch (err: any) {
        toast.error("Registration error", {
          description: err.message
        });
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  // Filter logic
  const filteredBookings = bookings.filter((booking) => {
    // 1. Status Filter
    if (statusFilter !== "ALL" && booking.paymentStatus !== statusFilter) {
      return false;
    }

    // 2. Search query (matches attendee name, email, or event name)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchAttendee = booking.user.name?.toLowerCase().includes(q) || booking.user.email?.toLowerCase().includes(q);
      const matchEvent = booking.event.eventName?.toLowerCase().includes(q);
      return matchAttendee || matchEvent;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const statusColors = {
    SUCCESS: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    PENDING: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    FAILED: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
    REFUNDED: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Bookings</h2>
        <p className="text-sm text-foreground/60 font-light mt-0.5">
          Monitor reservations, seating demands, and payment statuses across your hosted events.
        </p>
      </div>

      {/* Dynamic Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        {/* Search Input */}
        <div className="relative flex-grow flex items-center max-w-md">
          <Search className="absolute left-3 text-foreground/35 h-4 w-4 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search attendee name or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9.5 pl-9 bg-transparent border-border rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-ring text-sm w-full"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2 border border-border rounded-lg bg-background px-3 h-9.5 min-w-[140px] shrink-0">
          <Filter className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-xs text-foreground font-medium focus:outline-none cursor-pointer w-full"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="PENDING">Pending Only</option>
            <option value="REFUNDED">Refunded Only</option>
            <option value="FAILED">Failed Only</option>
          </select>
        </div>
      </div>

      {/* Main Table card */}
      <Card className="border border-border bg-card shadow-none rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="bg-foreground/[0.01] border-b border-border/40 text-[10px] uppercase font-bold tracking-wider text-foreground/50 select-none">
                <th className="py-3 px-5">ID</th>
                <th className="py-3 px-4">Event specifications</th>
                <th className="py-3 px-4">Attendee info</th>
                <th className="py-3 px-4">Pass tier</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4">Total Paid</th>
                <th className="py-3 px-4">Booking Date</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 text-xs font-light text-foreground/80">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-foreground/45 select-none font-normal">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-5 w-5 text-foreground/30" />
                      <span>No registrations match your search criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-foreground/[0.005] transition-colors">
                    {/* ID */}
                    <td className="py-4 px-5 font-mono text-[11px] text-foreground/50 font-medium">
                      #{booking.id}
                    </td>

                    {/* Event */}
                    <td className="py-4 px-4 font-normal">
                      <p className="font-semibold text-foreground leading-normal line-clamp-1">{booking.event.eventName}</p>
                      <p className="text-[10px] text-foreground/45 mt-0.5">
                        {new Date(booking.event.dateTime).toLocaleDateString()}
                      </p>
                    </td>

                    {/* Attendee */}
                    <td className="py-4 px-4 font-normal">
                      <p className="font-semibold text-foreground leading-normal">{booking.user.name}</p>
                      <p className="text-[10px] text-foreground/45 mt-0.5 leading-none">{booking.user.email}</p>
                    </td>

                    {/* Tier */}
                    <td className="py-4 px-4 font-semibold text-foreground/70">
                      {booking.ticketTier.tierName}
                    </td>

                    {/* Qty */}
                    <td className="py-4 px-4 text-center font-semibold text-foreground">
                      {booking.quantity}
                    </td>

                    {/* Total Paid */}
                    <td className="py-4 px-4 font-semibold text-foreground/90">
                      {formatPrice(booking.totalPricePaid, booking.currency)}
                    </td>

                    {/* Booking Date */}
                    <td className="py-4 px-4 text-foreground/50">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5 text-right shrink-0">
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm inline-block select-none ${statusColors[booking.paymentStatus]}`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-border/30">
            {filteredBookings.length === 0 ? (
              <div className="py-16 text-center text-foreground/45 select-none font-normal">
                <div className="flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="h-5 w-5 text-foreground/30" />
                  <span>No registrations match your search criteria.</span>
                </div>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div key={booking.id} className="p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-foreground/50 font-medium">#{booking.id}</span>
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm inline-block select-none ${statusColors[booking.paymentStatus]}`}>
                      {booking.paymentStatus}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-foreground leading-snug">{booking.event.eventName}</div>
                    <div className="text-[11px] text-foreground/60">
                      Attendee: <span className="font-medium text-foreground">{booking.user.name}</span> ({booking.user.email})
                    </div>
                    <div className="text-[11px] text-foreground/60">
                      Tier: <span className="font-medium text-foreground">{booking.ticketTier.tierName}</span> | Qty: <span className="font-medium text-foreground">{booking.quantity}</span>
                    </div>
                    <div className="text-[11px] text-foreground/60">
                      Total Paid: <span className="font-semibold text-foreground">{formatPrice(booking.totalPricePaid, booking.currency)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-foreground/50">
                    <span>Event Date: {new Date(booking.event.dateTime).toLocaleDateString()}</span>
                    <span>Booked: {new Date(booking.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
