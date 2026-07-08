"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Loader2, 
  Ticket, 
  ArrowLeft, 
  Sparkles, 
  User, 
  Receipt 
} from "lucide-react";
import { toast } from "sonner";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { formatPrice, getCurrencySymbol } from "@/backend/lib/currency";

countries.registerLocale(enLocale);

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
  description: string;
  location: string;
  country?: string;
  pincode?: string;
  dateTime: string;
  duration: string;
  status: string;
  banner?: string;
  thumbnail?: string;
  trailerUrls?: string[];
  currency: string;
  ticketTiers: TicketTier[];
  organizer: {
    id: number;
    name: string;
    email: string;
  };
  minimumAge : number | null;
  terms? : string | null;
}

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Auth Context
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Event Data State
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection Booking State
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [activeTrailerIndex, setActiveTrailerIndex] = useState(0);

  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST"
      });
      const data = await response.json();
      toast.success(data.message || "Logged out successfully!");
      setUser(null);
      router.refresh();
    } catch (err: any) {
      toast.error("Logout failed", {
        description: err.message,
      });
    }
  };

  const getVideoSource = (url?: string) => {
    if (!url) return null;
    const cleanUrl = url.trim();

    // 1. YouTube Match
    if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be")) {
      let videoId = "";
      if (cleanUrl.includes("watch?v=")) {
        videoId = cleanUrl.split("watch?v=")[1]?.split("&")[0] || "";
      } else if (cleanUrl.includes("youtu.be/")) {
        videoId = cleanUrl.split("youtu.be/")[1]?.split("?")[0] || "";
      } else if (cleanUrl.includes("embed/")) {
        videoId = cleanUrl.split("embed/")[1]?.split("?")[0] || "";
      }
      if (videoId && videoId.length === 11) {
        return { type: "embed", url: `https://www.youtube.com/embed/${videoId}` };
      }
    }

    // 2. Instagram Match (post, reel, tv)
    if (cleanUrl.includes("instagram.com")) {
      const igMatch = cleanUrl.match(/(?:instagram\.com)\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
      if (igMatch && igMatch[1]) {
        return { type: "embed", url: `https://www.instagram.com/reel/${igMatch[1]}/embed/` };
      }
    }

    // 3. Vimeo Match
    if (cleanUrl.includes("vimeo.com")) {
      const vimeoMatch = cleanUrl.match(/(?:vimeo\.com)\/([0-9]+)/);
      if (vimeoMatch && vimeoMatch[1]) {
        return { type: "embed", url: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
      }
    }

    // 4. Default direct video file
    return { type: "direct", url: cleanUrl };
  };

  // 1. Check user authentication state client-side
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        // Guest user
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, []);

  // 2. Fetch event details dynamically from API
  useEffect(() => {
    async function fetchEventDetails() {
      try {
        const res = await fetch(`/api/events/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to retrieve event details.");
        }

        setEvent(data.event);

        // Pre-select first tier
        if (data.event.ticketTiers && data.event.ticketTiers.length > 0) {
          setSelectedTierId(data.event.ticketTiers[0].id);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchEventDetails();
  }, [id]);

  // Handle selected tier change
  const handleTierChange = (tierId: number) => {
    setSelectedTierId(tierId);
    setQuantity(1); // Reset quantity counter
  };

  // Handle quantity adjustment
  const adjustQuantity = (delta: number, maxSeats: number) => {
    setQuantity((prev) => Math.max(1, Math.min(maxSeats, prev + delta)));
  };

  // Perform checkout/booking call
  const handleBooking = async () => {
    if (!authChecked) return;

    // 1. Force Sign In if guest
    if (!user) {
      toast.info("Authentication required", {
        description: "Please sign in to your customer account to reserve tickets."
      });
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // 2. Prevent non-customer roles from buying
    if (user.role !== "CUSTOMER") {
      toast.error("Booking forbidden", {
        description: `Only users with the CUSTOMER role can buy passes. Your current role is ${user.role}.`
      });
      return;
    }

    if (!selectedTierId) {
      toast.error("Please select a ticket tier.");
      return;
    }

    if(event?.minimumAge && !ageConfirmed){
      toast.error("Age confirmation required", {
        description: `Please confirm that you meet the minimum age requirement of ${event.minimumAge} years.`,
      });
      return;
    }

    setBookingInProgress(true);
    const toastId = toast.loading("Reserving your access pass...");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketTierId: selectedTierId,
          quantity: quantity
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Reservation failed.");
      }

      toast.dismiss(toastId);
      toast.success("Pass reserved successfully!", {
        description: "Redirecting to your tickets list..."
      });

      // Redirect to Attendee Tickets Dashboard catalog page
      setTimeout(() => {
        router.push("/dashboard/tickets");
      }, 1500);

    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Checkout failed", {
        description: err.message
      });
    } finally {
      setBookingInProgress(false);
    }
  };

  // Render Skeletons / Loader State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <header className="border-b border-border/40 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="bg-foreground/5 h-8 w-24 rounded-md animate-pulse"></div>
          </div>
        </header>
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-foreground/50 font-light">Loading event profiles...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render Error falls state
  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold tracking-tight text-lg">BookMyEvent</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-20 text-center flex flex-col items-center justify-center space-y-6">
          <div className="h-14 w-14 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
            <Ticket className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Event Profile Missing</h2>
            <p className="text-sm text-foreground/60 font-light max-w-md mx-auto">
              We couldn't retrieve the event you were looking for. It might have been deleted, cancelled, or doesn't exist.
            </p>
          </div>
          <Button 
            onClick={() => router.push("/")}
            className="bg-foreground text-background hover:bg-foreground/90 h-10 px-5 text-xs font-semibold rounded-md shadow-sm transition-all gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Discovery Feed
          </Button>
        </div>
      </div>
    );
  }

  const selectedTier = event.ticketTiers.find((t) => t.id === selectedTierId);
  const isSoldOut = selectedTier ? selectedTier.availableSeats <= 0 : true;

  // Calculators
  const priceUnit = selectedTier ? parseFloat(selectedTier.pricePerSeatExcludingTax) : 0;
  const taxRate = selectedTier ? parseFloat(selectedTier.taxPercentage) : 0;
  const subtotal = priceUnit * quantity;
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight text-lg">
              BookMyEvent
            </span>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground/75">
              <span
                className="hover:text-foreground cursor-pointer transition-colors"
                onClick={() => router.push("/")}
              >
                Discover
              </span>
              {authChecked && user && (
                <span
                  className="hover:text-foreground cursor-pointer transition-colors"
                  onClick={() => {
                    const r = user.role;
                    if (r === "ADMIN") router.push("/admin/dashboard");
                    else if (r === "ORGANIZER")
                      router.push("/organizer/dashboard");
                    else router.push("/dashboard");
                  }}
                >
                  Dashboard
                </span>
              )}
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              {authChecked &&
                (user ? (
                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-9 px-4 text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer"
                  >
                    Logout
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => router.push("/login")}
                      className="h-9 px-3 text-xs font-medium rounded-md hover:bg-foreground/5"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={() => router.push("/register")}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-xs font-semibold rounded-md shadow-sm transition-all"
                    >
                      Sign Up
                    </Button>
                  </>
                ))}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Page Grid Canvas */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-8">
        {/* Back Link */}
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-6 h-8 text-xs text-foreground/60 hover:text-foreground hover:bg-foreground/5 px-2 -ml-2 rounded-md gap-1 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to list
        </Button>

        {/* Content Columns */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* LEFT: Main Details Section */}
          <div className="md:col-span-2 space-y-6">
            {/* Banner block */}
            <div className="h-64 sm:h-96 w-full rounded-xl flex flex-col justify-end p-6 border border-border/40 relative overflow-hidden shadow-xs">
              {event.banner ? (
                <img
                  src={event.banner}
                  alt={event.eventName}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
              )}

              {/* Dark overlay fade to ensure high text contrast and readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent z-10" />

              <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md text-[10px] text-primary border border-primary/20 px-2.5 py-1 rounded-sm uppercase tracking-wider z-20 font-semibold">
                {event.status}
              </div>

              <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                {event.minimumAge && (
                  <div className="bg-amber-500 text-white text-[10px] border border-amber-600 px-2 py-0.5 rounded-sm uppercase tracking-wider font-extrabold flex items-center gap-1 shadow-sm">
                    <span>{event.minimumAge}+</span>
                  </div>
                )}
                <div className="bg-background/80 backdrop-blur-md text-[10px] text-primary border border-primary/20 px-2.5 py-1 rounded-sm uppercase tracking-wider font-semibold">
                  {event.status}
                </div>
              </div>

              <div className="space-y-2 z-20">
                <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-primary px-2 py-0.5 bg-primary/10 rounded-sm">
                  <Sparkles className="h-3 w-3" />
                  <span>Featured Profile</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight max-w-2xl text-foreground">
                  {event.eventName}
                </h1>
              </div>
            </div>

            {/* Host Details Row */}
            <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl shadow-xs">
              <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm border border-primary/20">
                {event.organizer?.name?.charAt(0).toUpperCase() || "O"}
              </div>
              <div>
                <p className="text-[10px] text-foreground/45 uppercase tracking-wider font-semibold">
                  Host / Organizer
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {event.organizer?.name || "Verified Event Host"}
                </p>
                <p className="text-xs text-foreground/50">
                  {event.organizer?.email}
                </p>
              </div>
            </div>

            {/* Long details */}
            <div className="space-y-3 bg-card border border-border p-6 rounded-xl shadow-xs">
              <h3 className="text-lg font-bold tracking-tight border-b border-border/40 pb-2.5">
                About the Event
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed font-light whitespace-pre-wrap">
                {event.description ||
                  "No description has been added for this event listing. Keep tabs for further details."}
              </p>
            </div>

            {/* Terms & Conditions Section */}
            {event.terms && (
              <div className="space-y-3 bg-card border border-border p-6 rounded-xl shadow-xs">
                <h3 className="text-lg font-bold tracking-tight border-b border-border/40 pb-2.5">
                  Terms & Conditions
                </h3>
                <p className="text-xs text-foreground/80 leading-relaxed font-light whitespace-pre-wrap font-mono bg-foreground/[0.015] border border-border/30 rounded-lg p-4">
                  {event.terms}
                </p>
              </div>
            )}

            {/* Teaser & Trailer Section */}
            {event.trailerUrls &&
              event.trailerUrls.length > 0 &&
              (() => {
                const activeUrl = event.trailerUrls[activeTrailerIndex];
                const video = getVideoSource(activeUrl);
                if (!video) return null;
                return (
                  <div className="space-y-3 bg-card border border-border p-6 rounded-xl shadow-xs">
                    <h3 className="text-lg font-bold tracking-tight border-b border-border/40 pb-2.5">
                      Event Teasers & Trailers
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-border/40 bg-black aspect-video relative shadow-xs">
                      {video.type === "embed" ? (
                        <iframe
                          src={video.url}
                          title={`Event Teaser Trailer ${activeTrailerIndex + 1}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0 absolute inset-0"
                        />
                      ) : (
                        <video
                          src={video.url}
                          controls
                          preload="metadata"
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>

                    {/* Dynamic selection tabs below player */}
                    {event.trailerUrls.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 mt-2 scrollbar-none select-none">
                        {event.trailerUrls.map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setActiveTrailerIndex(index)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                              activeTrailerIndex === index
                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                : "bg-background hover:bg-foreground/[0.03] text-foreground/60 hover:text-foreground border-border/80"
                            }`}
                          >
                            Teaser {index + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>

          {/* RIGHT: Booking Action Panel */}
          <div className="space-y-6">
            <div className="md:sticky md:top-24 space-y-6">
              <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden">
                <CardHeader className="bg-foreground/[0.01] border-b border-border/40 p-6 space-y-4">
                  <CardTitle className="text-base font-bold tracking-tight">
                    Access & Tickets
                  </CardTitle>
                  <CardDescription className="text-xs font-light text-foreground/60">
                    Choose your ticket tier and reserve seats.
                  </CardDescription>

                  {/* Metadata Specs */}
                  <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                    <div className="flex items-center gap-2 text-foreground/80 bg-background/50 border border-border/40 p-2.5 rounded-lg">
                      <Calendar className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-[9px] uppercase text-foreground/40 font-semibold">
                          Date
                        </p>
                        <p className="font-semibold">
                          {new Date(event.dateTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-foreground/80 bg-background/50 border border-border/40 p-2.5 rounded-lg">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-[9px] uppercase text-foreground/40 font-semibold">
                          Duration
                        </p>
                        <p className="font-semibold">{event.duration}</p>
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center gap-2 text-foreground/80 bg-background/50 border border-border/40 p-2.5 rounded-lg">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-[9px] uppercase text-foreground/40 font-semibold">
                          Location / Venue
                        </p>
                        <p className="font-semibold text-xs">
                          {event.location}
                          {event.country &&
                            `, ${countries.getName(event.country, "en") || event.country}`}
                          {event.pincode && ` (Pincode: ${event.pincode})`}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-5">
                  {event.ticketTiers.length > 0 ? (
                    <>
                      {/* Ticket Tier selector */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">
                          Select Ticket Tier
                        </label>
                        <select
                          value={selectedTierId || ""}
                          onChange={(e) =>
                            handleTierChange(parseInt(e.target.value, 10))
                          }
                          className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-none"
                        >
                          {event.ticketTiers.map((tier) => (
                            <option key={tier.id} value={tier.id}>
                              {tier.tierName} (
                              {formatPrice(
                                tier.pricePerSeatExcludingTax,
                                event.currency,
                              )}{" "}
                              • {tier.availableSeats} left)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity select counter */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">
                          Ticket Quantity
                        </span>
                        <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                          <button
                            type="button"
                            onClick={() =>
                              adjustQuantity(
                                -1,
                                selectedTier?.availableSeats || 0,
                              )
                            }
                            disabled={
                              quantity <= 1 || isSoldOut || bookingInProgress
                            }
                            className="px-3 py-1.5 text-sm hover:bg-foreground/5 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed border-none font-semibold"
                          >
                            -
                          </button>
                          <span className="px-4 py-1.5 text-xs font-semibold border-x border-border min-w-[2.5rem] text-center select-none">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              adjustQuantity(
                                1,
                                selectedTier?.availableSeats || 0,
                              )
                            }
                            disabled={
                              quantity >= (selectedTier?.availableSeats || 0) ||
                              isSoldOut ||
                              bookingInProgress
                            }
                            className="px-3 py-1.5 text-sm hover:bg-foreground/5 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed border-none font-semibold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Receipt Calculator */}
                      <div className="pt-4 border-t border-border/40 text-xs space-y-2 text-foreground/70">
                        <div className="flex items-center justify-between">
                          <span className="font-light">Subtotal</span>
                          <span className="font-medium text-foreground">
                            {formatPrice(subtotal, event.currency)}
                          </span>
                        </div>
                        {taxRate > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="font-light">
                              Tax / VAT ({taxRate}%)
                            </span>
                            <span className="font-medium text-foreground">
                              {formatPrice(taxAmount, event.currency)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-border/40 font-bold text-sm text-foreground">
                          <div className="flex items-center gap-1.5">
                            <Receipt className="h-4 w-4 text-foreground/50 stroke-[1.5]" />
                            <span>Grand Total</span>
                          </div>
                          <span>{formatPrice(grandTotal, event.currency)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-xs text-destructive py-4">
                      No ticket tiers have been configured for this event.
                    </div>
                  )}
                </CardContent>

                {event.minimumAge && (
                  <div className="pt-4 border-t border-border/40 text-xs space-y-2">
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 p-2.5 rounded-md flex items-start gap-2">
                      <div className="space-y-0.5">
                        <span className="font-semibold block">
                          Age Restriction: {event.minimumAge}+ Years
                        </span>
                        <span className="text-[10px] opacity-80 leading-snug block">
                          This event requires attendees to meet the minimum
                          eligibility age to enter.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center ml-2.5 gap-2 pt-1.5">
                      <input
                        type="checkbox"
                        id="confirmAge"
                        checked={ageConfirmed}
                        onChange={(e) => setAgeConfirmed(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/25 cursor-pointer"
                      />
                      <label
                        htmlFor="confirmAge"
                        className="text-[10px] text-foreground/75 cursor-pointer font-medium select-none"
                      >
                        I confirm that I am at least {event.minimumAge} years
                        old.
                      </label>
                    </div>
                  </div>
                )}

                <CardFooter className="p-6 pt-0">
                  <Button
                    onClick={handleBooking}
                    disabled={
                      event.ticketTiers.length === 0 ||
                      isSoldOut ||
                      bookingInProgress
                    }
                    className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg text-sm shadow-md transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {bookingInProgress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirming Seat...
                      </>
                    ) : isSoldOut ? (
                      "Sold Out"
                    ) : (
                      "Book Access Pass"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
