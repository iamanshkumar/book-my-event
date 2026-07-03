"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Loader2, 
  Plus, 
  Trash2, 
  Info,
  Calendar,
  Sparkles,
  DollarSign,
  Upload,
  X
} from "lucide-react";
import { toast } from "sonner";

interface TicketTierInput {
  name: string;
  totalSeats: number;
  price: number;
  taxPercentage: number;
}

export default function CreateEventPage() {
  const router = useRouter();

  // Event Specs State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [duration, setDuration] = useState("");
  const [banner, setBanner] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [trailerUrls, setTrailerUrls] = useState<string[]>([]);
  const [newTrailerUrl, setNewTrailerUrl] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Ticket Tiers State
  const [ticketTiers, setTicketTiers] = useState<TicketTierInput[]>([]);
  
  // New Ticket Tier form state
  const [tierName, setTierName] = useState("");
  const [tierSeats, setTierSeats] = useState("");
  const [tierPrice, setTierPrice] = useState("");
  const [tierTax, setTierTax] = useState("");

  const [loading, setLoading] = useState(false);

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

    const newTier: TicketTierInput = {
      name: tierName,
      totalSeats: seatsVal,
      price: priceVal,
      taxPercentage: taxVal
    };

    setTicketTiers((prev) => [...prev, newTier]);

    // Reset tier builder input fields
    setTierName("");
    setTierSeats("");
    setTierPrice("");
    setTierTax("");

    toast.success("Ticket tier added!");
  };

  // Remove a ticket tier from dynamic list
  const handleRemoveTier = (index: number) => {
    setTicketTiers((prev) => prev.filter((_, i) => i !== index));
    toast.info("Ticket tier removed.");
  };

  // Submit the entire event creation form
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

    setLoading(true);
    const toastId = toast.loading("Publishing event details and configuring ticket tiers...");

    try {
      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          location,
          dateTime,
          duration,
          banner: banner || undefined,
          thumbnail: thumbnail || undefined,
          trailerUrls: trailerUrls.length > 0 ? trailerUrls : undefined,
          category,
          ticketTiers
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Event publishing execution failed.");
      }

      toast.dismiss(toastId);
      toast.success("Event published successfully!", {
        description: "Your event listing is now live."
      });

      router.push("/organizer/events");
      
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Failed to publish event", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

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
        <h2 className="text-xl font-semibold tracking-tight">Schedule New Event</h2>
        <p className="text-sm text-foreground/60 font-light mt-0.5">
          Fill out specifications and setup ticket pricing tiers for your upcoming event.
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

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold text-foreground/80 font-medium">Description</Label>
                <textarea
                  id="description"
                  placeholder="Tell your attendees about the event schedules, rules, or special guests..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px] bg-transparent border border-border rounded-md px-3 py-2 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
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
                          <p className="font-semibold text-foreground">{tier.name}</p>
                          <p className="text-[9px] text-foreground/45 mt-0.5">Seats: {tier.totalSeats} • Tax: {tier.taxPercentage}%</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">₹{tier.price.toFixed(2)}</span>
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
                disabled={loading || ticketTiers.length === 0}
                className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg text-sm shadow-md transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing Event...
                  </>
                ) : (
                  "Publish Event"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
