"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Loader2, 
  Search, 
  MapPin, 
  Trash2, 
  ShieldAlert,
  AlertCircle,
  Download,
  Layers
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

  // Search, Filters, Sorting, and Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrganizer, setSelectedOrganizer] = useState("");
  const [startDate, setStartDate] = useState("");
  const [sortBy, setSortBy] = useState("date-asc");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedOrganizer, startDate, sortBy, pageSize]);

  // Extract unique organizers for filter dropdown
  const uniqueOrganizers = Array.from(
    new Set(events.map((e) => e.organizer?.name).filter(Boolean))
  );

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

  // Pricing range helper
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
      const matchHost = e.organizer?.name?.toLowerCase().includes(q);
      if (!matchName && !matchLoc && !matchHost) return false;
    }

    if (selectedOrganizer && selectedOrganizer !== "ALL_ORGANIZERS") {
      if (e.organizer?.name !== selectedOrganizer) return false;
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
      "Date/Time",
      "Duration",
      "Venue Location",
      "Organizer/Host",
      "Currency",
      "Pricing Range"
    ];

    const rows = sortedEvents.map((e) => {
      return [
        e.id,
        `"${e.eventName.replace(/"/g, '""')}"`,
        new Date(e.dateTime).toLocaleDateString(),
        e.duration,
        `"${e.location.replace(/"/g, '""')}"`,
        `"${(e.organizer?.name || "System Host").replace(/"/g, '""')}"`,
        e.currency,
        `"${getPriceRange(e.ticketTiers, e.currency).replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `admin_events_moderation_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("CSV report downloaded successfully!");
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

      {/* Advanced Filter Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 bg-card border border-border p-4 rounded-xl text-xs select-none">
        {/* Search */}
        <div className="space-y-1.5 lg:col-span-2">
          <Label className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Search Details</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-foreground/40" />
            <Input
              type="text"
              placeholder="Search name, venue or organizer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 pl-8 text-xs bg-transparent border-border rounded-md shadow-none focus-visible:ring-1 focus-visible:ring-ring text-card-foreground w-full"
            />
          </div>
        </div>

        {/* Organizer Filter */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Organizer</Label>
          <Select value={selectedOrganizer} onValueChange={setSelectedOrganizer}>
            <SelectTrigger className="h-8.5 bg-transparent border-border text-card-foreground text-xs">
              <SelectValue placeholder="All Organizers" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-card-foreground text-xs">
              <SelectItem value="ALL_ORGANIZERS">All Organizers</SelectItem>
              {uniqueOrganizers.map((org) => (
                <SelectItem key={org} value={org}>
                  {org}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </div>

      {/* CSV Export Bar */}
      <div className="flex justify-end select-none">
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="h-8.5 border-border text-foreground hover:bg-foreground/5 rounded-md text-xs font-semibold gap-1.5 cursor-pointer flex items-center px-4"
        >
          <Download className="h-4 w-4 text-foreground/60" />
          Export CSV
        </Button>
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
                {paginatedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-foreground/45 select-none font-normal">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-5 w-5 text-foreground/30" />
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

                      {/* Event details */}
                      <td className="py-4 px-4 font-normal">
                        <p className="font-semibold text-foreground leading-normal line-clamp-1">{e.eventName}</p>
                        <p className="text-[10px] text-foreground/45 mt-0.5 flex items-center gap-1.5 font-light">
                          <Calendar className="h-3.5 w-3.5 text-foreground/35" />
                          <span>{new Date(e.dateTime).toLocaleDateString()} ({e.duration})</span>
                        </p>
                      </td>

                      {/* Venue location */}
                      <td className="py-4 px-4 font-normal text-foreground/70">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-foreground/35 shrink-0" />
                          <span className="line-clamp-1">{e.location}</span>
                        </div>
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
              {paginatedEvents.length === 0 ? (
                <div className="py-16 text-center text-foreground/45 select-none font-normal">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-5 w-5 text-foreground/30" />
                    <span>No active event listings found.</span>
                  </div>
                </div>
              ) : (
                paginatedEvents.map((e) => (
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

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
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
