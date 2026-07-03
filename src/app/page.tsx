"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  MapPin,
  Search,
  ArrowRight,
  Clock,
  Ticket,
  SlidersHorizontal
} from "lucide-react";
import { toast } from "sonner";

interface TicketTier {
  id: number;
  tierName: string;
  pricePerSeatExcludingTax: string;
}

interface Event {
  id: number;
  eventName: string;
  description: string;
  location: string;
  dateTime: string;
  duration: string;
  status: string;
  thumbnail?: string;
  banner?: string;
  ticketTiers: TicketTier[];
  organizer: {
    name: string;
  };
}


export default function Home() {
  const router = useRouter();

  // Authentication State
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("soonest"); // "soonest", "latest", "price-low", "price-high"

  // Events Feed State
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Check Auth on Mount
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

  // Fetch Events based on search criteria
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("name", searchTerm);
      if (locationTerm) params.append("location", locationTerm);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/events/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load events.");
      }

      setEvents(data.events || []);
    } catch (err: any) {
      toast.error("Searching events failed", {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    handleSearch();
  }, []);

  // Sort events locally
  const getSortedEvents = () => {
    const sorted = [...events];
    if (sortBy === "soonest") {
      return sorted.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }
    if (sortBy === "latest") {
      return sorted.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    }
    if (sortBy === "price-low") {
      return sorted.sort((a, b) => {
        const aMin = a.ticketTiers.length > 0 ? Math.min(...a.ticketTiers.map(t => parseFloat(t.pricePerSeatExcludingTax))) : 0;
        const bMin = b.ticketTiers.length > 0 ? Math.min(...b.ticketTiers.map(t => parseFloat(t.pricePerSeatExcludingTax))) : 0;
        return aMin - bMin;
      });
    }
    if (sortBy === "price-high") {
      return sorted.sort((a, b) => {
        const aMin = a.ticketTiers.length > 0 ? Math.min(...a.ticketTiers.map(t => parseFloat(t.pricePerSeatExcludingTax))) : 0;
        const bMin = b.ticketTiers.length > 0 ? Math.min(...b.ticketTiers.map(t => parseFloat(t.pricePerSeatExcludingTax))) : 0;
        return bMin - aMin;
      });
    }
    return sorted;
  };

  const handleCTA = () => {
    if (!user) {
      router.push("/register");
    } else {
      const role = user.role;
      if (role === "ADMIN") router.push("/admin/dashboard");
      else if (role === "ORGANIZER") router.push("/organizer/dashboard");
      else router.push("/dashboard");
    }
  };

  const sortedEvents = getSortedEvents();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* 1. Glassmorphism Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="font-semibold tracking-tight text-lg">BookMyEvent</span>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground/75">
              <span className="text-foreground cursor-pointer font-semibold">Discover</span>
              {authChecked && user && (
                <span
                  className="hover:text-foreground cursor-pointer transition-colors"
                  onClick={() => {
                    const r = user.role;
                    if (r === "ADMIN") router.push("/admin/dashboard");
                    else if (r === "ORGANIZER") router.push("/organizer/dashboard");
                    else router.push("/dashboard");
                  }}
                >
                  Dashboard
                </span>
              )}
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              {authChecked && (
                user ? (
                  <Button
                    onClick={handleCTA}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-xs font-semibold rounded-md shadow-sm transition-all"
                  >
                    Go to Dashboard
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
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Typographical Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-6 max-w-7xl mx-auto w-full text-center space-y-8">
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground">
            Unlock Unforgettable <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">Live Experiences</span>
          </h1>
          <p className="text-base sm:text-lg text-foreground/60 font-light max-w-xl mx-auto leading-relaxed">
            Reserve your spots instantly, access dynamic ticketing passes, and experience events live.
          </p>
        </div>

        <div className="flex justify-center gap-4 pt-2">
          <Button
            onClick={() => {
              const el = document.getElementById("catalog-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-foreground text-background hover:bg-foreground/90 h-11 px-6 text-sm font-semibold rounded-md shadow-md transition-all gap-2"
          >
            Explore Events
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* 3. Search & Filters Console */}
      <section className="px-6 max-w-7xl mx-auto w-full pb-8">
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-4">
            {/* Name Search */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-foreground/40 pointer-events-none" />
              <Input
                placeholder="Search event title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-9 pr-3 bg-transparent border-border focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Location Search */}
            <div className="relative flex items-center">
              <MapPin className="absolute left-3 h-4 w-4 text-foreground/40 pointer-events-none" />
              <Input
                placeholder="Location / Venue..."
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                className="h-10 pl-9 pr-3 bg-transparent border-border focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Start Date */}
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 h-4 w-4 text-foreground/40 pointer-events-none" />
              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 pl-9 pr-3 bg-transparent border-border focus-visible:ring-1 focus-visible:ring-ring text-xs text-foreground/60"
              />
            </div>

            {/* Submit search button */}
            <Button
              type="submit"
              className="h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-md shadow-xs transition-colors"
            >
              Filter Catalogs
            </Button>
          </form>

          {/* Expanded filters toggle */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border/40 text-xs text-foreground/60 justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>End Date Boundary:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-7 w-36 px-2 py-0.5 bg-transparent border-border text-[10px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Sort Order:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border border-border rounded-md px-2 py-1 text-xs focus:outline-none"
              >
                <option value="soonest">Happening Soonest</option>
                <option value="latest">Recently Added</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Events Catalog Grid Feed */}
      <section id="catalog-section" className="flex-1 px-6 max-w-7xl mx-auto w-full pb-20 space-y-6 scroll-mt-20">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Active Catalogs</h2>
            <p className="text-xs text-foreground/60 font-light mt-0.5">Explore active published events curated for the community.</p>
          </div>
          <span className="text-xs font-semibold text-primary px-2.5 py-1 bg-primary/10 rounded-full">
            {sortedEvents.length} {sortedEvents.length === 1 ? "Event" : "Events"} Found
          </span>
        </div>

        {loading ? (
          /* Loading Skeletons */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border border-border rounded-lg p-5 space-y-4 animate-pulse">
                <div className="h-44 bg-foreground/5 rounded-md"></div>
                <div className="h-5 bg-foreground/10 rounded-sm w-3/4"></div>
                <div className="h-4 bg-foreground/5 rounded-sm w-1/2"></div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-foreground/5 rounded-sm w-5/6"></div>
                  <div className="h-3 bg-foreground/5 rounded-sm w-4/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedEvents.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl bg-card/30 space-y-4">
            <Ticket className="h-10 w-10 text-foreground/25" />
            <div className="text-center">
              <h3 className="text-base font-semibold">No Matching Events Found</h3>
              <p className="text-xs text-foreground/50 font-light mt-1">Try tweaking your filters or adjusting your date selection boundaries.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setLocationTerm("");
                setStartDate("");
                setEndDate("");
                handleSearch();
              }}
              className="mt-2 text-xs border-border h-9"
            >
              Reset Search Filters
            </Button>
          </div>
        ) : (
          /* Events Grid Feed */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedEvents.map((event) => {
              const lowestPrice = event.ticketTiers.length > 0
                ? Math.min(...event.ticketTiers.map(t => parseFloat(t.pricePerSeatExcludingTax)))
                : 0;

              return (
                <Card key={event.id} className="border border-border bg-card shadow-none rounded-lg flex flex-col justify-between overflow-hidden group">
                  {/* Thumbnail Image Header block */}
                  <div className="h-40 w-full flex flex-col items-start justify-between p-4 border-b border-border/40 relative overflow-hidden">
                    {event.thumbnail ? (
                      <img 
                        src={event.thumbnail} 
                        alt={event.eventName} 
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
                    )}
                    
                    {/* Glassmorphic overlays to ensure text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent z-10" />

                    <span className="text-[9px] uppercase font-bold tracking-widest text-primary px-2.5 py-0.5 bg-background/95 border border-primary/20 rounded-sm z-20 backdrop-blur-md shadow-xs">
                      Upcoming
                    </span>

                    <div className="space-y-0.5 mt-auto z-20">
                      <span className="text-[9px] uppercase tracking-wider text-foreground/45 font-semibold">Host / Organizer</span>
                      <p className="text-xs font-semibold text-foreground/80">{event.organizer?.name || "Verified Event Host"}</p>
                    </div>
                  </div>

                  <CardHeader className="space-y-1.5 p-5">
                    <CardTitle className="text-base font-bold tracking-tight leading-snug group-hover:text-primary transition-colors line-clamp-1">
                      {event.eventName}
                    </CardTitle>
                    <CardDescription className="text-xs font-light text-foreground/70 line-clamp-2 min-h-[2rem]">
                      {event.description || "No descriptions provided for this initiative."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-2 px-5 pb-5 text-xs text-foreground/60 font-normal">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-foreground/40" />
                      <span>{new Date(event.dateTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-foreground/40" />
                      <span>Duration: {event.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-foreground/40" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  </CardContent>

                  <CardFooter className="flex items-center justify-between border-t border-border/40 p-5 mt-auto bg-foreground/[0.01]">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-foreground/45 uppercase tracking-wider font-semibold">Price Starts From</span>
                      <span className="text-sm font-bold tracking-tight">
                        {event.ticketTiers.length === 0 ? "Free" : `₹${lowestPrice.toFixed(2)}`}
                      </span>
                    </div>

                    <Button
                      onClick={() => router.push(`/events/${event.id}`)}
                      className="h-8.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3.5 text-xs font-semibold shadow-xs transition-colors"
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-border/40 py-8 bg-card text-center text-xs text-foreground/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} BookMyEvent. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
            <span className="hover:underline cursor-pointer">Terms of Service</span>
            <span className="hover:underline cursor-pointer" onClick={() => router.push("/login")}>Attendee Login</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
