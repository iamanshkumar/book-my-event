"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  MapPin, 
  Clock, 
  Receipt, 
  Printer, 
  XCircle,
  Sparkles,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface Booking {
  id: number;
  quantity: number;
  totalPricePaid: string;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  createdAt: string;
  event: {
    eventName: string;
    dateTime: string;
    location: string;
    duration: string;
    banner?: string;
    thumbnail?: string;
  };
  ticketTier: {
    tierName: string;
    pricePerSeatExcludingTax: string;
    taxPercentage: string;
  };
  user: {
    name: string;
    email: string;
  };
}

export default function TicketDetailsPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Fetch single booking details
  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load booking details.");
        }
        setBooking(data.booking);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [bookingId]);

  // Handle Cancel Booking action
  const handleCancelBooking = async () => {
    if (!booking) return;

    const confirmCancel = window.confirm("Are you sure you want to cancel this ticket booking? This will immediately release your reserved seats.");
    if (!confirmCancel) return;

    setCancelling(true);
    const toastId = toast.loading("Processing ticket cancellation...");

    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: "POST"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel reservation.");
      }

      toast.dismiss(toastId);
      toast.success("Reservation cancelled successfully!", {
        description: "Your seats have been released and order updated."
      });

      // Update local state
      setBooking((prev) => prev ? { ...prev, paymentStatus: "REFUNDED" } : null);

    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Cancellation failed", {
        description: err.message
      });
    } finally {
      setCancelling(false);
    }
  };

  // Render Skeletons / Loader State
  if (loading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-foreground/50 font-light">Loading ticket invoice details...</p>
      </div>
    );
  }

  // Render Error fallback state
  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="h-14 w-14 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Receipt Not Found</h2>
          <p className="text-xs text-foreground/60 font-light max-w-sm mx-auto">
            We couldn't retrieve the ticket details. Please make sure the booking ID is valid.
          </p>
        </div>
        <Button 
          onClick={() => router.push("/dashboard")}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-xs font-semibold rounded-md shadow-sm transition-all gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Calculation Breakdown
  const priceUnit = parseFloat(booking.ticketTier.pricePerSeatExcludingTax);
  const taxRate = parseFloat(booking.ticketTier.taxPercentage);
  const subtotal = priceUnit * booking.quantity;
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = parseFloat(booking.totalPricePaid);

  const statusColors = {
    SUCCESS: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    PENDING: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    FAILED: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
    REFUNDED: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20",
  };

  const isCancellable = booking.paymentStatus !== "REFUNDED" && booking.paymentStatus !== "FAILED";

  return (
    <div className="space-y-6 max-w-3xl mx-auto print:py-0 print:border-none">
      {/* Back Link (Hidden in print) */}
      <div className="flex items-center justify-between print:hidden">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/dashboard")}
          className="h-8 text-xs text-foreground/60 hover:text-foreground hover:bg-foreground/5 px-2 -ml-2 rounded-md gap-1 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Button>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.print()}
            className="h-8 text-xs border-border text-foreground hover:bg-foreground/5 rounded-md px-3 gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Receipt
          </Button>
          
          {isCancellable && (
            <Button 
              variant="outline"
              disabled={cancelling}
              onClick={handleCancelBooking}
              className="h-8 text-xs border-destructive/20 text-destructive hover:bg-destructive/5 rounded-md px-3 gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      {/* Ticket Pass Receipt Card wrapper */}
      <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden print:border-none print:shadow-none">
        
        {/* Ticket Header Banner */}
        <div className="border-b border-border/40 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden">
          {booking.event.banner ? (
            <img 
              src={booking.event.banner} 
              alt={booking.event.eventName} 
              className="absolute inset-0 h-full w-full object-cover opacity-15 dark:opacity-20 pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
          )}

          <div className="space-y-1 z-10">
            <span className="text-[10px] uppercase tracking-wider font-bold text-primary px-2.5 py-0.5 bg-primary/10 rounded-sm inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Digital Gate Pass
            </span>
            <h2 className="text-xl font-extrabold tracking-tight mt-1">{booking.event.eventName}</h2>
            <p className="text-xs text-foreground/50 font-light">Order Reference ID: #{booking.id}</p>
          </div>

          <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-sm shrink-0 w-fit z-10 ${statusColors[booking.paymentStatus]}`}>
            {booking.paymentStatus}
          </span>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-8">
          
          {/* Main Detail Section (QR Pass & Stats Columns) */}
          <div className="grid gap-6 md:grid-cols-3 items-center">
            
            {/* QR Mockup column */}
            <div className="flex flex-col items-center justify-center p-4 bg-background border border-border/60 rounded-xl space-y-3">
              {/* Custom SVG QR Grid Mockup */}
              <svg className="h-36 w-36 text-foreground bg-white border border-border/60 p-2 rounded-lg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 5h30v30H5V5zm4 4v22h22V9H9z" fill="currentColor"/>
                <path d="M65 5h30v30H65V5zm4 4v22h22V9H69z" fill="currentColor"/>
                <path d="M5 65h30v30H5V65zm4 4v22h22V69H9z" fill="currentColor"/>
                <rect x="15" y="15" width="10" height="10" fill="currentColor"/>
                <rect x="75" y="15" width="10" height="10" fill="currentColor"/>
                <rect x="15" y="75" width="10" height="10" fill="currentColor"/>
                <path d="M45 5h10v10H45V5zm10 15h10v15H55V20zm-10 20h20v10H45V40zm25 15h10v20H70V55zm-15 15h10v25H55V70zm15 15h25v10H70V85zm-25 0h10v10H45V85z" fill="currentColor" opacity="0.85"/>
              </svg>
              <span className="text-[9px] uppercase tracking-wider font-bold text-foreground/50 flex items-center gap-1">
                <Info className="h-3 w-3" /> Scan at Gate
              </span>
            </div>

            {/* Event Info Details columns */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                {/* Date */}
                <div className="flex items-center gap-2 bg-background/50 border border-border/40 p-3 rounded-lg">
                  <Calendar className="h-4.5 w-4.5 text-primary" />
                  <div>
                    <p className="text-[9px] uppercase text-foreground/40 font-bold">Date & Time</p>
                    <p className="font-semibold text-foreground/90">{new Date(booking.event.dateTime).toLocaleString()}</p>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 bg-background/50 border border-border/40 p-3 rounded-lg">
                  <Clock className="h-4.5 w-4.5 text-primary" />
                  <div>
                    <p className="text-[9px] uppercase text-foreground/40 font-bold">Duration</p>
                    <p className="font-semibold text-foreground/90">{booking.event.duration}</p>
                  </div>
                </div>

                {/* Venue */}
                <div className="col-span-2 flex items-center gap-2 bg-background/50 border border-border/40 p-3 rounded-lg">
                  <MapPin className="h-4.5 w-4.5 text-primary shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase text-foreground/40 font-bold">Venue / Location</p>
                    <p className="font-semibold text-foreground/90 line-clamp-1">{booking.event.location}</p>
                  </div>
                </div>
              </div>

              {/* Attendee Pass details */}
              <div className="p-3.5 bg-foreground/5 border border-border rounded-lg text-xs space-y-1.5">
                <p className="text-[10px] uppercase font-bold text-foreground/50 tracking-wider">Attendee Info</p>
                <div className="flex justify-between">
                  <span className="font-light text-foreground/70">Name:</span>
                  <span className="font-semibold text-foreground">{booking.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-light text-foreground/70">Email:</span>
                  <span className="font-semibold text-foreground">{booking.user.email}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border/20">
                  <span className="font-light text-foreground/70">Ticket Tier:</span>
                  <span className="font-semibold text-primary">{booking.ticketTier.tierName} Pass</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Invoice receipt section */}
          <div className="space-y-3 pt-6 border-t border-border/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/50 flex items-center gap-1">
              <Receipt className="h-4 w-4 text-foreground/40" />
              Receipt Breakdown
            </h4>

            <div className="space-y-2 text-xs text-foreground/70 font-light">
              <div className="flex items-center justify-between">
                <span>Base Price per Seat ({booking.ticketTier.tierName})</span>
                <span className="font-medium text-foreground">₹{priceUnit.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Quantity</span>
                <span className="font-medium text-foreground">x {booking.quantity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">₹{subtotal.toFixed(2)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex items-center justify-between">
                  <span>VAT / Taxes ({taxRate}%)</span>
                  <span className="font-medium text-foreground">₹{taxAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t border-border/40 font-bold text-sm text-foreground">
                <span>Total Amount Paid</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

import { AlertCircle } from "lucide-react";
