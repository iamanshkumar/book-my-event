"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);
import { getCurrencySymbol } from "@/backend/lib/currency";

const countriesObject = countries.getNames("en", { select: "official" });
const countriesList = Object.entries(countriesObject).map(([alpha2, name]) => ({
  code: countries.alpha2ToAlpha3(alpha2) || "",
  name
})).filter(c => c.code).sort((a, b) => a.name.localeCompare(b.name));
import { 
  ArrowLeft, 
  Loader2, 
  Plus, 
  Trash2, 
  Info,
  Calendar,
  Sparkles,
  AlertTriangle,
  Upload,
  X
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
  const [terms, setTerms] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("IND");
  const [pincode, setPincode] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [duration, setDuration] = useState("");
  const [banner, setBanner] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [trailerUrls, setTrailerUrls] = useState<string[]>([]);
  const [newTrailerUrl, setNewTrailerUrl] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [currency, setCurrency] = useState("INR");
  const [allowedCurrencies, setAllowedCurrencies] = useState<string[]>(["INR"]);

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

  const [requiredMinimumAge , setRequiredMinimumAge] = useState(false);
  const [minimumAge , setMinimumAge] = useState<number | "">("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "thumbnail" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "thumbnail") setUploadingThumbnail(true);
    else setUploadingBanner(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await fetch("/api/events/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      if (type === "thumbnail") {
        setThumbnail(data.url);
        toast.success("Thumbnail uploaded successfully!");
      } else {
        setBanner(data.url);
        toast.success("Banner uploaded successfully!");
      }
    } catch (err: any) {
      toast.error("Upload failed", {
        description: err.message
      });
    } finally {
      if (type === "thumbnail") setUploadingThumbnail(false);
      else setUploadingBanner(false);
    }
  };

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
        setTerms(ev.terms || "");
        setLocation(ev.location || "");
        setDuration(ev.duration || "");
        setBanner(ev.banner || "");
        setThumbnail(ev.thumbnail || "");
        setTrailerUrls((ev.trailerUrls as string[]) || []);
        setCategory(ev.category || "OTHER");
        setCountry(ev.country || "IND");
        setPincode(ev.pincode || "");
        setCurrency(ev.currency || "INR");

        if (ev.minimumAge) {
          setRequiredMinimumAge(true);
          setMinimumAge(ev.minimumAge);
        } else {
          setRequiredMinimumAge(false);
          setMinimumAge("");
        }

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

  useEffect(() => {
    async function getCurrencies() {
      try {
        const res = await fetch("/api/organizer/settings/currency");
        const data = await res.json();
        if (res.ok) {
          setAllowedCurrencies(data.allowedCurrencies || ["INR"]);
        }
      } catch (err) {}
    }
    getCurrencies();
  }, []);

  // useState(()=>{
  //   if(originalEvent)
  // })

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
          country,
          pincode: pincode || null,
          dateTime: new Date(dateTime).toISOString(),
          duration,
          banner: banner || null,
          thumbnail: thumbnail || null,
          trailerUrls: trailerUrls.length > 0 ? trailerUrls : null,
          category,
          currency,
          minimumAge: requiredMinimumAge ? Number(minimumAge) : null,
          terms: terms || null,
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

              {/* Country & Pincode Selection Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Country dropdown */}
                <div className="space-y-1.5">
                  <Label htmlFor="country" className="text-xs font-semibold text-foreground/80">Country *</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="w-full h-10 bg-transparent border-border text-sm text-card-foreground focus:ring-1 focus:ring-ring">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card text-card-foreground max-h-56 overflow-y-auto">
                      {countriesList.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pincode Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="pincode" className="text-xs font-semibold text-foreground/80">Pincode / Zip Code</Label>
                  <Input
                    id="pincode"
                    type="text"
                    placeholder="e.g. 110001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="h-10 bg-transparent border-border rounded-md px-3 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
                  />
                </div>
              </div>

              {/* Event Category Select Dropdown */}
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-semibold text-foreground/80">Event Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full h-10 bg-transparent border-border text-sm text-card-foreground focus:ring-1 focus:ring-ring">
                    <SelectValue placeholder="Select event category" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card text-card-foreground">
                    <SelectItem value="TECH">Tech Events</SelectItem>
                    <SelectItem value="MUSIC">Music & Concerts</SelectItem>
                    <SelectItem value="SPORTS">Sports & Fitness</SelectItem>
                    <SelectItem value="COMEDY">Comedy Shows</SelectItem>
                    <SelectItem value="MOVIES">Movies & Cinema</SelectItem>
                    <SelectItem value="ARTS_THEATER">Arts & Theater</SelectItem>
                    <SelectItem value="BUSINESS">Business & Networking</SelectItem>
                    <SelectItem value="FOOD_DRINK">Food & Drink</SelectItem>
                    <SelectItem value="OTHER">Other / Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Age Restriction Configuration */}
              <div className="space-y-4 border border-border p-4 rounded-lg bg-card/40">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-foreground">Age Restrictions</label>
                    <p className="text-[10px] text-foreground/50">Restrict ticket booking validation to a minimum eligibility age</p>
                  </div>
                  <input
                    type="checkbox"
                    id="requireMinimumAge"
                    checked={requiredMinimumAge}
                    onChange={(e) => {
                      setRequiredMinimumAge(e.target.checked);
                      if (!e.target.checked) setMinimumAge("");
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/25 cursor-pointer"
                  />
                </div>

                {requiredMinimumAge && (
                  <div className="space-y-1.5 pt-2 border-t border-border/40 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label htmlFor="minimumAge" className="text-xs font-semibold text-foreground/80">Minimum Required Age (Years) *</label>
                    <Input
                      id="minimumAge"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="e.g. 18"
                      value={minimumAge}
                      onChange={(e) => setMinimumAge(e.target.value ? parseInt(e.target.value, 10) : "")}
                      required={requiredMinimumAge}
                      className="h-10 bg-transparent border-border rounded-md px-3 text-card-foreground text-sm w-full"
                    />
                  </div>
                )}
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

              {/* Terms & Conditions */}
              <div className="space-y-1.5">
                <Label htmlFor="terms" className="text-xs font-semibold text-foreground/80 font-medium">Terms & Conditions</Label>
                <textarea
                  id="terms"
                  placeholder="Detail any terms, conditions, age policies, or cancellation rules for attendees..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="min-h-[100px] w-full bg-transparent border border-border rounded-md px-3 py-2 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
                />
              </div>

              {/* Banner & Thumbnail File Uploads */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Thumbnail Upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground/80">Event Thumbnail (Optional)</Label>
                  {thumbnail ? (
                    <div className="relative h-40 w-full rounded-lg overflow-hidden border border-border group">
                      <img src={thumbnail} alt="Thumbnail preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setThumbnail("")}
                        className="absolute top-2 right-2 bg-background/80 hover:bg-background text-foreground/80 hover:text-foreground p-1.5 rounded-full border border-border transition-all cursor-pointer z-10"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-border/80 hover:border-primary/50 rounded-lg h-40 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors relative hover:bg-foreground/[0.005]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, "thumbnail")}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {uploadingThumbnail ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-foreground/45 mb-2" />
                          <span className="text-xs font-medium text-foreground/80">Upload Thumbnail</span>
                          <span className="text-[10px] text-foreground/45 mt-1">Drag and drop or click to browse</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Banner Upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground/80">Event Banner (Optional)</Label>
                  {banner ? (
                    <div className="relative h-40 w-full rounded-lg overflow-hidden border border-border group">
                      <img src={banner} alt="Banner preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setBanner("")}
                        className="absolute top-2 right-2 bg-background/80 hover:bg-background text-foreground/80 hover:text-foreground p-1.5 rounded-full border border-border transition-all cursor-pointer z-10"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-border/80 hover:border-primary/50 rounded-lg h-40 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors relative hover:bg-foreground/[0.005]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, "banner")}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {uploadingBanner ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-foreground/45 mb-2" />
                          <span className="text-xs font-medium text-foreground/80">Upload Banner</span>
                          <span className="text-[10px] text-foreground/45 mt-1">Drag and drop or click to browse</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Event Teasers/Trailers URL List */}
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-semibold text-foreground/80">Event Teaser & Trailer Videos (Optional)</Label>
                
                {/* Dynamic list of added trailers */}
                {trailerUrls.length > 0 && (
                  <div className="space-y-2">
                    {trailerUrls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between bg-background border border-border/45 p-2 rounded-lg text-xs gap-3">
                        <span className="truncate text-foreground/80 flex-1">{url}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setTrailerUrls((prev) => prev.filter((_, i) => i !== index))}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive p-0 cursor-pointer shrink-0 rounded-md"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new trailer link form */}
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    value={newTrailerUrl}
                    onChange={(e) => setNewTrailerUrl(e.target.value)}
                    className="h-10 bg-transparent border-border rounded-md px-3 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all placeholder:text-foreground/30 text-card-foreground text-sm flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newTrailerUrl.trim()) {
                        setTrailerUrls((prev) => [...prev, newTrailerUrl.trim()]);
                        setNewTrailerUrl("");
                        toast.success("Teaser link added!");
                      } else {
                        toast.error("Please enter a valid URL.");
                      }
                    }}
                    className="h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-md text-sm transition-colors cursor-pointer"
                  >
                    Add Link
                  </Button>
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
                          <span className="font-semibold text-foreground">{getCurrencySymbol(currency)}{tier.pricePerSeatExcludingTax.toFixed(2)}</span>
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
                    <Label htmlFor="tierPrice" className="text-[10px] font-semibold text-foreground/80">Base Price ({getCurrencySymbol(currency)})</Label>
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

                {/* Event Currency */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-foreground/80">Event Currency *</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-8.5 bg-transparent border-border text-card-foreground text-xs">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {allowedCurrencies.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
