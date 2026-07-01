"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Loader2, 
  Plus, 
  Trash2, 
  Info,
  Calendar,
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

interface TicketTier {
  id?: number;
  tierName: string;
  totalSeats: number;
  availableSeats?: number;
  pricePerSeatExcludingTax: number;
  taxPercentage: number;
}

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Event Specs State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [duration, setDuration] = useState("");
  const [banner, setBanner] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  // Ticket Tiers State
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  
  // New Ticket Tier form state
  const [tierName, setTierName] = useState("");
  const [tierSeats, setTierSeats] = useState("");
  const [tierPrice, setTierPrice] = useState("");
  const [tierTax, setTierTax] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current event specifications on mount
  useEffect(() => {
    async function fetchEventDetails() {
      try {
        const res = await fetch(`/api/events/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load event details.");
        }

        const ev = data.event;
        setName(ev.eventName || "");
        setDescription(ev.description || "");
        setLocation(ev.location || "");
        setDuration(ev.duration || "");
        setBanner(ev.banner || "");
        setThumbnail(ev.thumbnail || "");

        // Format date string correctly for <input type="datetime-local">
        if (ev.dateTime) {
          const dateObj = new Date(ev.dateTime);
          const offset = dateObj.getTimezoneOffset();
          const localDate = new Date(dateObj.getTime() - offset * 60 * 1000);
          setDateTime(localDate.toISOString().slice(0, 16));
        }

        // Load existing ticket configurations
        if (ev.ticketTiers) {
          setTicketTiers(
            ev.ticketTiers.map((tier: any) => ({
              id: tier.id,
              tierName: tier.tierName,
              totalSeats: tier.totalSeats,
              availableSeats: tier.availableSeats,
              pricePerSeatExcludingTax: parseFloat(tier.pricePerSeatExcludingTax),
              taxPercentage: parseFloat(tier.taxPercentage || "0")
            }))
          );
        }
      } catch (err: any) {
        setError(err.message || "Failed to load event.");
      } finally {
        setLoading(false);
      }
    }
    fetchEventDetails();
  }, [id]);

  // Add a ticket tier dynamically
  const handleAddTier = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!tierName || !tierSeats || !tierPrice) {
      toast.error("Invalid tier inputs", {
        description: "Please specify Tier Name, Seating Capacity, and Base Price."
      });
      return;
    }

    const seatsVal = parseInt(tierSeats, 10);
    const priceVal = parseFloat(tierPrice);
    const taxVal = parseFloat(tierTax || "0");

    if (isNaN(seatsVal) || seatsVal <= 0) {
      toast.error("Invalid seating capacity", {
        description: "Total seats must be a positive integer."
      });
      return;
    }

    if (isNaN(priceVal) || priceVal < 0) {
      toast.error("Invalid seat pricing", {
        description: "Base seat price cannot be negative."
      });
      return;
    }

    if (isNaN(taxVal) || taxVal < 0 || taxVal > 100) {
      toast.error("Invalid tax percentage", {
        description: "Tax rate must be a percentage between 0 and 100."
      });
      return;
    }

    const newTier: TicketTier = {
      tierName,
      totalSeats: seatsVal,
      availableSeats: seatsVal,
      pricePerSeatExcludingTax: priceVal,
      taxPercentage: taxVal
    };

    setTicketTiers((prev) => [...prev, newTier]);

    // Reset tier builder input fields
    setTierName("");
    setTierSeats("");
    setTierPrice("");
    setTierTax("");

    toast.success("Ticket tier configuration added!");
  };

  // Remove a ticket tier from dynamic list
  const handleRemoveTier = (index: number) => {
    setTicketTiers((prev) => prev.filter((_, i) => i !== index));
    toast.info("Ticket tier removed.");
  };

  // Submit the entire event modification form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !location || !dateTime || !duration) {
      toast.error("Mandatory fields missing", {
        description: "Please fill out Event Name, Location, Schedule Date, and Duration."
      });
      return;
    }

    if (ticketTiers.length === 0) {
      toast.error("Seating configurations missing", {
        description: "Please configure at least one ticket tier for this event."
      });
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Updating event details and rebuilding ticket configurations...");

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: name,
          description: description || null,
          location,
          dateTime: new Date(dateTime).toISOString(),
          duration,
          banner: banner || null,
          thumbnail: thumbnail || null,
          ticketTiers: ticketTiers.map((tier) => ({
            tierName: tier.tierName,
            totalSeats: tier.totalSeats,
            availableSeats: tier.availableSeats ?? tier.totalSeats,
            pricePerSeatExcludingTax: tier.pricePerSeatExcludingTax,
            taxPercentage: tier.taxPercentage
          }))
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Event update execution failed.");
      }

      toast.dismiss(toastId);
      toast.success("Event details updated successfully!");

      router.push("/organizer/events");
      
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Failed to update event", {
        description: err.message
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !name) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="h-14 w-14 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Event Profile Missing</h2>
          <p className="text-xs text-foreground/60 font-light max-w-sm mx-auto">
            We couldn't retrieve the event you were trying to edit. Please make sure the ID is valid.
          </p>
        </div>
        <Button 
          onClick={() => router.push("/organizer/events")}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-xs font-semibold rounded-md shadow-sm transition-all gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Catalog
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/organizer/events")}
          className="h-8 text-xs text-foreground/60 hover:text-foreground hover:bg-foreground/5 px-2 -ml-2 rounded-md gap-1 transition-all cursor-pointer font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Catalog
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight">Adjust Event Details</h2>
        <p className="text-sm text-foreground/60 font-light mt-0.5">
          Modify event specs, configure details, or add new ticket tiers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
        {/* LEFT COLUMN: Event Specifications */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-border bg-card shadow-xs rounded-xl p-2">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-sm font-bold tracking-tight uppercase text-foreground/50 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-foreground/45" /> Event Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Event Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-foreground/80">Event Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Summer Music Festival 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-10 bg-transparent border-border rounded-md px-3 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
                />
              </div>

              {/* Date & Time and Duration Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="dateTime" className="text-xs font-semibold text-foreground/80">Schedule Date & Time *</Label>
                  <Input
                    id="dateTime"
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    required
                    className="h-10 bg-transparent border-border rounded-md px-3 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all text-card-foreground text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="duration" className="text-xs font-semibold text-foreground/80">Event Duration *</Label>
                  <Input
                    id="duration"
                    type="text"
                    placeholder="e.g. 3 hours, 2 days"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    className="h-10 bg-transparent border-border rounded-md px-3 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
                  />
                </div>
              </div>

              {/* Location Address */}
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-semibold text-foreground/80">Venue / Location Address *</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g. Grand Arena Hall, New Delhi"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="h-10 bg-transparent border-border rounded-md px-3 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold text-foreground/80 font-medium">Description</Label>
                <textarea
                  id="description"
                  placeholder="Tell your attendees about the event schedules, rules, or special guests..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px] w-full bg-transparent border border-border rounded-md px-3 py-2 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
                />
              </div>

              {/* Banner & Thumbnail Visual Links */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="thumbnail" className="text-xs font-semibold text-foreground/80 font-medium">Thumbnail Image URL</Label>
                  <Input
                    id="thumbnail"
                    type="url"
                    placeholder="https://example.com/thumbnail.png"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    className="h-10 bg-transparent border-border rounded-md px-3 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="banner" className="text-xs font-semibold text-foreground/80 font-medium">Banner Image URL</Label>
                  <Input
                    id="banner"
                    type="url"
                    placeholder="https://example.com/banner.png"
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                    className="h-10 bg-transparent border-border rounded-md px-3 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Ticket Tiers Builder */}
        <div className="space-y-6">
          <Card className="border border-border bg-card shadow-xs rounded-xl p-2">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-sm font-bold tracking-tight uppercase text-foreground/50 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-foreground/45" /> Ticket Configurations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              
              {/* Added Tiers Catalog List */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Configured Tiers</span>
                
                {ticketTiers.length === 0 ? (
                  <div className="text-center py-4 border border-dashed border-border rounded-lg bg-background/50 text-[10px] text-foreground/50 font-light flex items-center justify-center gap-1.5">
                    <Info className="h-3.5 w-3.5" /> No ticket configurations added.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {ticketTiers.map((tier, index) => (
                      <div key={index} className="flex justify-between items-center bg-background/60 border border-border/40 p-2.5 rounded-lg text-xs">
                        <div>
                          <p className="font-semibold text-foreground">{tier.tierName}</p>
                          <p className="text-[9px] text-foreground/45 mt-0.5">Seats: {tier.availableSeats} / {tier.totalSeats} • Tax: {tier.taxPercentage}%</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">₹{tier.pricePerSeatExcludingTax.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTier(index)}
                            className="text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* New Tier input fields form */}
              <div className="pt-4 border-t border-border/40 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Add Ticket Tier</span>
                
                {/* Tier Name */}
                <div className="space-y-1">
                  <Label htmlFor="tierName" className="text-[10px] font-semibold text-foreground/80">Tier Name</Label>
                  <Input
                    id="tierName"
                    type="text"
                    placeholder="e.g. VIP Access, General Pass"
                    value={tierName}
                    onChange={(e) => setTierName(e.target.value)}
                    className="h-8.5 text-xs bg-transparent border-border rounded-md px-2.5 shadow-none placeholder:text-foreground/30 text-card-foreground"
                  />
                </div>

                {/* Capacity & Price row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="tierSeats" className="text-[10px] font-semibold text-foreground/80">Seat Capacity</Label>
                    <Input
                      id="tierSeats"
                      type="number"
                      placeholder="e.g. 100"
                      value={tierSeats}
                      onChange={(e) => setTierSeats(e.target.value)}
                      className="h-8.5 text-xs bg-transparent border-border rounded-md px-2.5 shadow-none placeholder:text-foreground/30 text-card-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tierPrice" className="text-[10px] font-semibold text-foreground/80">Base Price (₹)</Label>
                    <Input
                      id="tierPrice"
                      type="number"
                      placeholder="e.g. 499"
                      value={tierPrice}
                      onChange={(e) => setTierPrice(e.target.value)}
                      className="h-8.5 text-xs bg-transparent border-border rounded-md px-2.5 shadow-none placeholder:text-foreground/30 text-card-foreground"
                    />
                  </div>
                </div>

                {/* Tax percentage */}
                <div className="space-y-1">
                  <Label htmlFor="tierTax" className="text-[10px] font-semibold text-foreground/80">Tax Rate (%)</Label>
                  <Input
                    id="tierTax"
                    type="number"
                    placeholder="e.g. 18 (optional)"
                    value={tierTax}
                    onChange={(e) => setTierTax(e.target.value)}
                    className="h-8.5 text-xs bg-transparent border-border rounded-md px-2.5 shadow-none placeholder:text-foreground/30 text-card-foreground"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleAddTier}
                  className="w-full h-8.5 bg-foreground text-background hover:bg-foreground/90 font-medium rounded-lg text-xs mt-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  Add Tier Config
                </Button>
              </div>
            </CardContent>

            <CardFooter className="pt-2 pb-4 border-t border-border/40">
              <Button
                type="submit"
                disabled={saving || ticketTiers.length === 0}
                className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg text-sm shadow-md transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
