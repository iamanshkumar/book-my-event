"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Layers,
  Search,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/backend/lib/currency";

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
  currency: string;
  ticketTiers: TicketTier[];
}

export default function EventCatalogPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter, Sort, Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [sortBy, setSortBy] = useState("date-asc");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, sortBy, pageSize]);

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

  // Pricing range calculation
  const getPriceRange = (tiers: TicketTier[], currency = "INR") => {
    if (!tiers || tiers.length === 0) return "N/A";
    const prices = tiers.map((t) => parseFloat(t.pricePerSeatExcludingTax));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max 
      ? formatPrice(min, currency) 
      : `${formatPrice(min, currency)} - ${formatPrice(max, currency)}`;
  };

  // Filter logic
  const filteredEvents = events.filter((e) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = e.eventName?.toLowerCase().includes(q);
      const matchLoc = e.location?.toLowerCase().includes(q);
      const matchStatus = e.status?.toLowerCase().includes(q);
      if (!matchName && !matchLoc && !matchStatus) return false;
    }

    if (startDate) {
      const eventDate = new Date(e.dateTime);
      const filterDate = new Date(startDate);
      eventDate.setHours(0, 0, 0, 0);
      filterDate.setHours(0, 0, 0, 0);
      if (eventDate < filterDate) return false;
    }

    return true;
  });

  // Sorting logic
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === "date-asc") {
      return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
    }
    if (sortBy === "date-desc") {
      return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
    }
    if (sortBy === "name-asc") {
      return a.eventName.localeCompare(b.eventName);
    }
    if (sortBy === "name-desc") {
      return b.eventName.localeCompare(a.eventName);
    }
    if (sortBy === "id-asc") {
      return a.id - b.id;
    }
    if (sortBy === "id-desc") {
      return b.id - a.id;
    }
    return 0;
  });

  // Pagination bounds
  const totalRecords = sortedEvents.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedEvents = sortedEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // CSV Export logic
  const handleExportCSV = () => {
    if (sortedEvents.length === 0) {
      toast.error("No records matching the filters to export.");
      return;
    }

    const headers = [
      "Event ID",
      "Event Name",
      "Date",
      "Duration",
      "Location",
      "Status",
      "Currency",
      "Tiers Summary",
      "Pricing Range"
    ];

    const rows = sortedEvents.map((e) => {
      const tiersStr = e.ticketTiers
        .map((t) => `${t.tierName} (${t.availableSeats}/${t.totalSeats})`)
        .join(" | ");
      return [
        e.id,
        `"${e.eventName.replace(/"/g, '""')}"`,
        new Date(e.dateTime).toLocaleDateString(),
        e.duration,
        `"${e.location.replace(/"/g, '""')}"`,
        e.status,
        e.currency,
        `"${tiersStr.replace(/"/g, '""')}"`,
        `"${getPriceRange(e.ticketTiers, e.currency).replace(/"/g, '""')}"`
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `organizer_events_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV report downloaded successfully!");
  };

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Toolbar */}
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

      {/* Advanced Filter Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 bg-card border border-border p-4 rounded-xl text-xs select-none">
        {/* Search */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Search Details</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-foreground/40" />
            <Input
              type="text"
              placeholder="Search code, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 pl-8 text-xs bg-transparent border-border rounded-md shadow-none focus-visible:ring-1 focus-visible:ring-ring text-card-foreground w-full"
            />
          </div>
        </div>

        {/* Date Filter */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Start Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8.5 text-xs bg-transparent border-border rounded-md shadow-none focus-visible:ring-1 focus-visible:ring-ring text-card-foreground w-full"
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Sort Records</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8.5 bg-transparent border-border text-card-foreground text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-card-foreground text-xs">
              <SelectItem value="date-asc">Date (Ascending)</SelectItem>
              <SelectItem value="date-desc">Date (Descending)</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="id-asc">Event ID (Low-High)</SelectItem>
              <SelectItem value="id-desc">Event ID (High-Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page Size Dropdown */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Page Size</Label>
          <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
            <SelectTrigger className="h-8.5 bg-transparent border-border text-card-foreground text-xs">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-card-foreground text-xs">
              <SelectItem value="20">20 records</SelectItem>
              <SelectItem value="50">50 records</SelectItem>
              <SelectItem value="100">100 records</SelectItem>
              <SelectItem value="200">200 records</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* CSV Export Button */}
        <div className="space-y-1.5 flex flex-col justify-end">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="h-8.5 border-border text-foreground hover:bg-foreground/5 rounded-md text-xs font-semibold gap-1.5 cursor-pointer flex items-center justify-center w-full"
          >
            <Download className="h-4 w-4 text-foreground/60" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Events Table Container */}
      <Card className="border border-border bg-card shadow-none rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="bg-foreground/[0.01] border-b border-border/40 text-[10px] uppercase font-bold tracking-wider text-foreground/50 select-none">
                <th className="py-3.5 px-5">Event ID</th>
                <th className="py-3.5 px-4">Event Details</th>
                <th className="py-3.5 px-4">Venue Location</th>
                <th className="py-3.5 px-4">Ticket Tiers Summary</th>
                <th className="py-3.5 px-4">Pricing Range</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 text-xs font-light text-foreground/80">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-foreground/45 select-none font-normal">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="h-5 w-5 text-foreground/30" />
                      <span>No active event listings found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-foreground/[0.005] transition-colors">
                    {/* ID */}
                    <td className="py-4 px-5 font-mono text-[11px] text-foreground/50 font-medium">
                      #{e.id}
                    </td>

                    {/* Details */}
                    <td className="py-4 px-4 font-normal">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground leading-normal line-clamp-1">{e.eventName}</span>
                        <span className="text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20 shrink-0">
                          {e.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-foreground/45 mt-0.5 flex items-center gap-1.5 font-light">
                        <Calendar className="h-3.5 w-3.5 text-foreground/35" />
                        <span>{new Date(e.dateTime).toLocaleDateString()} ({e.duration})</span>
                      </p>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4 font-normal text-foreground/70">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-foreground/35 shrink-0" />
                        <span className="line-clamp-1">{e.location}</span>
                      </div>
                    </td>

                    {/* Tiers Summary */}
                    <td className="py-4 px-4 font-normal">
                      {e.ticketTiers.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          {e.ticketTiers.map((t) => (
                            <span
                              key={t.id}
                              className="text-[9px] bg-foreground/[0.03] border border-border/40 text-foreground/75 px-1.5 py-0.5 rounded-md"
                              title={`Seats: ${t.availableSeats} available / ${t.totalSeats} total`}
                            >
                              {t.tierName} ({t.availableSeats}/{t.totalSeats})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-rose-500 font-medium bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          Warning: No tiers configured
                        </span>
                      )}
                    </td>

                    {/* Pricing Range */}
                    <td className="py-4 px-4 font-semibold text-foreground/90">
                      {getPriceRange(e.ticketTiers, e.currency)}
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-5 text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          onClick={() => router.push(`/organizer/events/edit/${e.id}`)}
                          className="h-7 w-7 p-0 border border-border/40 hover:bg-foreground/5 rounded-md cursor-pointer flex items-center justify-center"
                          title="Edit Event"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-foreground/60" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleDeleteEvent(e.id)}
                          className="h-7 w-7 p-0 border border-destructive/20 text-destructive hover:bg-destructive/10 rounded-md cursor-pointer flex items-center justify-center"
                          title="Delete Event"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-border/30">
            {paginatedEvents.length === 0 ? (
              <div className="py-16 text-center text-foreground/45 select-none font-normal">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Layers className="h-5 w-5 text-foreground/30" />
                  <span>No active event listings found.</span>
                </div>
              </div>
            ) : (
              paginatedEvents.map((e) => (
                <div key={e.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-foreground/50 font-medium">#{e.id}</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20 shrink-0">
                      {e.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
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
                      Pricing: <span className="font-semibold text-foreground">{getPriceRange(e.ticketTiers, e.currency)}</span>
                    </div>
                    <div className="pt-1.5 flex gap-1">
                      {e.ticketTiers.map((t) => (
                        <span key={t.id} className="text-[9px] bg-foreground/[0.03] border border-border/40 text-foreground/75 px-1 py-0.5 rounded">
                          {t.tierName}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/organizer/events/edit/${e.id}`)}
                      className="h-8 flex-1 border-border text-foreground hover:bg-foreground/5 rounded-md text-[11px] font-semibold transition-colors gap-1 cursor-pointer flex items-center justify-center"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-foreground/60" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteEvent(e.id)}
                      className="h-8 flex-1 border-destructive/20 text-destructive hover:bg-destructive/10 rounded-md text-[11px] font-semibold transition-colors gap-1 cursor-pointer flex items-center justify-center"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border/40 flex items-center justify-between text-xs text-foreground/50 select-none bg-foreground/[0.005]">
            <span>
              Showing Page <strong className="text-foreground font-semibold">{currentPage}</strong> of <strong className="text-foreground font-semibold">{totalPages}</strong> ({totalRecords} total records)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-7 border-border px-2 text-foreground font-semibold hover:bg-foreground/5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-7 border-border px-2 text-foreground font-semibold hover:bg-foreground/5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
