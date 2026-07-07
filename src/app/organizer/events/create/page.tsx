"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { getCurrencySymbol } from "@/backend/lib/currency";

countries.registerLocale(enLocale);

const countriesObject = countries.getNames("en", { select: "official" });
const countriesList = Object.entries(countriesObject)
  .map(([alpha2, name]) => ({
    code: countries.alpha2ToAlpha3(alpha2) || "",
    name,
  }))
  .filter((c) => c.code)
  .sort((a, b) => a.name.localeCompare(b.name));

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
  X,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
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

  // Ticket Tiers State
  const [ticketTiers, setTicketTiers] = useState<TicketTierInput[]>([]);

  // New Ticket Tier form state
  const [tierName, setTierName] = useState("");
  const [tierSeats, setTierSeats] = useState("");
  const [tierPrice, setTierPrice] = useState("");
  const [tierTax, setTierTax] = useState("");

  const [loading, setLoading] = useState(false);

  // CSV Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [allowedCurrencies, setAllowedCurrencies] = useState<string[]>(["INR"]);
  const [currency, setCurrency] = useState("INR");

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "thumbnail" | "banner",
  ) => {
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
        body: formData,
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
        description: err.message,
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
        description:
          "Please specify Tier Name, Seating Capacity, and Base Price.",
      });
      return;
    }

    const seatsVal = parseInt(tierSeats, 10);
    const priceVal = parseFloat(tierPrice);
    const taxVal = parseFloat(tierTax || "0");

    if (isNaN(seatsVal) || seatsVal <= 0) {
      toast.error("Invalid seating capacity", {
        description: "Total seats must be a positive integer.",
      });
      return;
    }

    if (isNaN(priceVal) || priceVal < 0) {
      toast.error("Invalid seat pricing", {
        description: "Base seat price cannot be negative.",
      });
      return;
    }

    if (isNaN(taxVal) || taxVal < 0 || taxVal > 100) {
      toast.error("Invalid tax percentage", {
        description: "Tax rate must be a percentage between 0 and 100.",
      });
      return;
    }

    const newTier: TicketTierInput = {
      name: tierName,
      totalSeats: seatsVal,
      price: priceVal,
      taxPercentage: taxVal,
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
        description:
          "Please fill out Event Name, Location, Schedule Date, and Duration.",
      });
      return;
    }

    if (ticketTiers.length === 0) {
      toast.error("Seating configurations missing", {
        description:
          "Please configure at least one ticket tier for this event.",
      });
      return;
    }

    setLoading(true);
    const toastId = toast.loading(
      "Publishing event details and configuring ticket tiers...",
    );

    try {
      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          location,
          country,
          pincode: pincode || undefined,
          dateTime,
          duration,
          banner: banner || undefined,
          thumbnail: thumbnail || undefined,
          trailerUrls: trailerUrls.length > 0 ? trailerUrls : undefined,
          category,
          currency,
          ticketTiers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Event publishing execution failed.");
      }

      toast.dismiss(toastId);
      toast.success("Event published successfully!", {
        description: "Your event listing is now live.",
      });

      router.push("/organizer/events");
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Failed to publish event", {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // CSV bulk template generators
  const handleDownloadTemplate = () => {
    const headers = [
      "event_name",
      "description",
      "location",
      "country",
      "pincode",
      "date_time",
      "duration",
      "category",
      "tier_name",
      "total_seats",
      "price_per_seat",
      "tax_percentage",
    ];
    const sampleRow1 = [
      "Summer Music Festival",
      "Outdoor live rock concert",
      "Open Air Arena",
      "IND",
      "110001",
      "2026-08-15T18:00:00Z",
      "6 hours",
      "MUSIC",
      "VIP Pass",
      "100",
      "2500.00",
      "18",
    ];
    const sampleRow2 = [
      "Summer Music Festival",
      "Outdoor live rock concert",
      "Open Air Arena",
      "IND",
      "110001",
      "2026-08-15T18:00:00Z",
      "6 hours",
      "MUSIC",
      "General Admission",
      "1000",
      "500.00",
      "5",
    ];

    const csvContent = [
      headers.join(","),
      sampleRow1.join(","),
      sampleRow2.join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "bulk_events_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setValidationErrors([]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setUploadingCSV(true);
    setValidationErrors([]);
    const formData = new FormData();
    formData.append("file", selectedFile);

    const toastId = toast.loading("Processing bulk event CSV upload...");
    try {
      const res = await fetch("/api/events/bulk-upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Bulk Upload Successful!", {
          description: `${data.eventsCreated} events and ${data.tiersCreated} ticket tiers created.`,
          id: toastId,
        });
        setIsModalOpen(false);
        setSelectedFile(null);
        router.push("/organizer/events");
      } else {
        if (data.details) {
          setValidationErrors(data.details);
          toast.error("Upload failed validation.", { id: toastId });
        } else {
          throw new Error(data.error || "Bulk upload process failed.");
        }
      }
    } catch (err: any) {
      toast.error("Upload failed", {
        description: err.message,
        id: toastId,
      });
    } finally {
      setUploadingCSV(false);
    }
  };

  useEffect(()=>{
    async function getCurrencies(){
      try{
        const res = await fetch("/api/organizer/settings/currency");
        const data = await res.json();

        if(res.ok){
          setAllowedCurrencies(data.allowedCurrencies || ["INR"]);
          setCurrency(data.defaultCurrency || "INR");
        }
      }catch(err){
      }
    }

    getCurrencies();
  },[]);

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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Schedule New Event
          </h2>
          <p className="text-sm text-foreground/60 font-light mt-0.5">
            Fill out specifications and setup ticket pricing tiers for your
            upcoming event.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className="border-border text-foreground hover:bg-foreground/5 h-9.5 px-4 text-xs font-semibold rounded-lg transition-all gap-1.5 cursor-pointer w-fit"
        >
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          Bulk Upload CSV
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
        {/* LEFT COLUMN: Event Specifications */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-border bg-card shadow-xs rounded-xl p-2">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-sm font-bold tracking-tight uppercase text-foreground/50 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-foreground/45" /> Event
                Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Event Name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs font-semibold text-foreground/80"
                >
                  Event Name *
                </Label>
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
                  <Label
                    htmlFor="dateTime"
                    className="text-xs font-semibold text-foreground/80"
                  >
                    Schedule Date & Time *
                  </Label>
                  <Input
                    id="dateTime"
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    required
                    className="h-10 bg-transparent border-border rounded-md px-3 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all text-card-foreground text-sm cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="duration"
                    className="text-xs font-semibold text-foreground/80"
                  >
                    Event Duration *
                  </Label>
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

              {/* Venue / Location Address */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="location"
                  className="text-xs font-semibold text-foreground/80"
                >
                  Venue / Location Address *
                </Label>
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

              {/* Country and Pincode Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/80">
                    Country *
                  </Label>
                  <Select
                    value={country}
                    onValueChange={(val) => setCountry(val)}
                  >
                    <SelectTrigger className="h-10 bg-transparent border-border text-card-foreground text-sm">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] bg-card border-border">
                      {countriesList.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="pincode"
                    className="text-xs font-semibold text-foreground/80"
                  >
                    Pincode / Zip Code
                  </Label>
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

              {/* Event Category */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">
                  Event Category
                </Label>
                <Select
                  value={category}
                  onValueChange={(val) => setCategory(val)}
                >
                  <SelectTrigger className="h-10 bg-transparent border-border text-card-foreground text-sm">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="TECH">Technology & Devs</SelectItem>
                    <SelectItem value="MUSIC">Concerts & Music</SelectItem>
                    <SelectItem value="SPORTS">Sports & Fitness</SelectItem>
                    <SelectItem value="COMEDY">Comedy Shows</SelectItem>
                    <SelectItem value="MOVIES">Movie Screenings</SelectItem>
                    <SelectItem value="ARTS_THEATER">Arts & Theater</SelectItem>
                    <SelectItem value="BUSINESS">Business Seminar</SelectItem>
                    <SelectItem value="FOOD_DRINK">Food & Drinks</SelectItem>
                    <SelectItem value="OTHER">Other / Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="description"
                  className="text-xs font-semibold text-foreground/80 font-medium"
                >
                  Description
                </Label>
                <textarea
                  id="description"
                  placeholder="Tell your attendees about the event schedules, rules, or special guests..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px] w-full bg-transparent border border-border rounded-md px-3 py-2 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-foreground/30 text-card-foreground text-sm"
                />
              </div>

              {/* Banner & Thumbnail File Uploads */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Thumbnail Upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground/80">
                    Event Thumbnail (Optional)
                  </Label>
                  {thumbnail ? (
                    <div className="relative border border-border rounded-lg overflow-hidden group h-32 w-full">
                      <img
                        src={thumbnail}
                        alt="Thumbnail Preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setThumbnail("")}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1.5 rounded-full hover:bg-destructive/90 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border/60 hover:border-primary/50 rounded-xl h-32 flex flex-col items-center justify-center p-4 transition-all bg-foreground/[0.005]">
                      <input
                        type="file"
                        id="thumbnail-upload"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, "thumbnail")}
                        className="hidden"
                      />
                      <label
                        htmlFor="thumbnail-upload"
                        className="flex flex-col items-center gap-1 cursor-pointer"
                      >
                        {uploadingThumbnail ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <>
                            <Upload className="h-5 w-5 text-foreground/45" />
                            <span className="text-[11px] font-semibold text-foreground/70">
                              Upload Thumbnail
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                {/* Banner Upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground/80">
                    Event Banner (Optional)
                  </Label>
                  {banner ? (
                    <div className="relative border border-border rounded-lg overflow-hidden group h-32 w-full">
                      <img
                        src={banner}
                        alt="Banner Preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setBanner("")}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1.5 rounded-full hover:bg-destructive/90 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border/60 hover:border-primary/50 rounded-xl h-32 flex flex-col items-center justify-center p-4 transition-all bg-foreground/[0.005]">
                      <input
                        type="file"
                        id="banner-upload"
                        accept="image/*"
                        onChange={(e) => handleUpload(e, "banner")}
                        className="hidden"
                      />
                      <label
                        htmlFor="banner-upload"
                        className="flex flex-col items-center gap-1 cursor-pointer"
                      >
                        {uploadingBanner ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <>
                            <Upload className="h-5 w-5 text-foreground/45" />
                            <span className="text-[11px] font-semibold text-foreground/70">
                              Upload Banner
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Trailer Videos (Optional) */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-foreground/80">
                  Teaser & Trailer Video Links (Optional)
                </Label>

                {/* List of links */}
                {trailerUrls.length > 0 && (
                  <div className="space-y-2 border border-border/30 rounded-lg p-3 bg-foreground/[0.005]">
                    {trailerUrls.map((url, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 text-xs bg-card border border-border/40 p-2 rounded-md"
                      >
                        <span className="truncate font-light text-foreground/80">
                          {url}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setTrailerUrls((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                          className="text-destructive hover:bg-destructive/10 p-1 rounded-md transition-all cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input box */}
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="e.g. https://youtube.com/watch?v=..."
                    value={newTrailerUrl}
                    onChange={(e) => setNewTrailerUrl(e.target.value)}
                    className="h-10 bg-transparent border-border rounded-md shadow-none text-xs flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!newTrailerUrl.trim()) return;
                      setTrailerUrls((prev) => [...prev, newTrailerUrl.trim()]);
                      setNewTrailerUrl("");
                    }}
                    className="h-10 border-border text-xs px-3 font-semibold rounded-md transition-colors cursor-pointer"
                  >
                    Add Link
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Ticket Configs and Save */}
        <div className="space-y-6">
          {/* Tiers List */}
          <Card className="border border-border bg-card shadow-xs rounded-xl p-2">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-sm font-bold tracking-tight uppercase text-foreground/50 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-foreground/45" /> Configured
                Tiers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {ticketTiers.length === 0 ? (
                <div className="text-center py-6 text-foreground/45 border border-dashed border-border rounded-lg bg-foreground/[0.005]">
                  <p className="text-xs">No ticketing configurations added.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ticketTiers.map((tier, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs bg-foreground/[0.015] border border-border/40 p-3 rounded-lg"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold">{tier.name}</p>
                        <p className="text-[10px] text-foreground/45">
                          {tier.totalSeats} seats | Tax: {tier.taxPercentage}%
                        </p>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <span className="font-bold text-foreground">
                          {getCurrencySymbol(currency)}{tier.price.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTier(i)}
                          className="text-destructive hover:bg-destructive/10 p-1 rounded-md transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Tier Builder */}
          <Card className="border border-border bg-card shadow-xs rounded-xl p-2">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-sm font-bold tracking-tight uppercase text-foreground/50 flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-foreground/45" /> Add Ticket Tier
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="tierName"
                  className="text-xs font-semibold text-foreground/80"
                >
                  Tier Name
                </Label>
                <Input
                  id="tierName"
                  type="text"
                  placeholder="e.g. VIP Access, General Pass"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  className="h-10 bg-transparent border-border rounded-md shadow-none text-xs"
                />
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="tierSeats"
                    className="text-xs font-semibold text-foreground/80"
                  >
                    Seat Capacity
                  </Label>
                  <Input
                    id="tierSeats"
                    type="number"
                    placeholder="e.g. 100"
                    value={tierSeats}
                    onChange={(e) => setTierSeats(e.target.value)}
                    className="h-10 bg-transparent border-border rounded-md shadow-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="tierPrice"
                    className="text-xs font-semibold text-foreground/80"
                  >
                    Base Price ({getCurrencySymbol(currency)})
                  </Label>
                  <Input
                    id="tierPrice"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 499"
                    value={tierPrice}
                    onChange={(e) => setTierPrice(e.target.value)}
                    className="h-10 bg-transparent border-border rounded-md shadow-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="tierTax"
                  className="text-xs font-semibold text-foreground/80"
                >
                  Tax Rate (%)
                </Label>
                <Input
                  id="tierTax"
                  type="number"
                  placeholder="e.g. 18 (optional)"
                  value={tierTax}
                  onChange={(e) => setTierTax(e.target.value)}
                  className="h-10 bg-transparent border-border rounded-md shadow-none text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">
                  Event Currency *
                </Label>
                <Select
                  value={currency}
                  onValueChange={(val) => setCurrency(val)}
                >
                  <SelectTrigger className="h-10 bg-transparent border-border text-card-foreground text-sm">
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
                className="w-full h-10 border border-primary/20 text-foreground bg-foreground/[0.015] hover:bg-foreground/[0.035] text-xs font-semibold rounded-md shadow-none transition-colors gap-1.5 cursor-pointer flex items-center justify-center"
              >
                <Plus className="h-4 w-4" />
                Add Tier Config
              </Button>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Publish Event
          </Button>
        </div>
      </form>

      {/* Bulk Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col justify-between animate-in zoom-in-95 duration-200 text-card-foreground">
            {/* Modal Header */}
            <div className="p-5 border-b border-border/40 flex items-center justify-between bg-foreground/[0.005]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold tracking-tight">
                  Bulk Upload Events
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedFile(null);
                }}
                className="text-foreground/40 hover:text-foreground/80 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs leading-relaxed max-h-[60vh] overflow-y-auto">
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3.5 flex items-start gap-2.5 text-foreground/85">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">CSV Formatting Rule:</p>
                  <p className="text-[11px] text-foreground/60 font-light">
                    Define one ticket tier per row. To associate multiple ticket
                    tiers with a single event, use identical{" "}
                    <strong>event_name</strong>, <strong>location</strong>, and{" "}
                    <strong>date_time</strong> values on successive rows.
                  </p>
                </div>
              </div>

              {/* Template Download */}
              <div className="flex items-center justify-between border border-border/40 rounded-lg p-3 bg-foreground/[0.015]">
                <div className="space-y-0.5">
                  <p className="font-bold">Missing the template file?</p>
                  <p className="text-[11px] text-foreground/45 font-light">
                    Download a valid sample events spreadsheet.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="h-8 border-border text-xs px-2.5 rounded-md gap-1 cursor-pointer flex items-center"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>

              {/* Upload Drag & Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/60 hover:border-primary/45 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer bg-foreground/[0.005] hover:bg-foreground/[0.015] transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                    <div className="text-center">
                      <p className="font-bold text-foreground">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-foreground/40 mt-0.5 font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-foreground/30" />
                    <div className="text-center">
                      <p className="font-bold text-foreground">
                        Click to select CSV File
                      </p>
                      <p className="text-[10px] text-foreground/40 mt-0.5">
                        Accepts .csv spreadsheet files
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Validation Errors Reporting */}
              {validationErrors.length > 0 && (
                <div className="space-y-2 border border-destructive/20 bg-destructive/5 rounded-lg p-4">
                  <div className="flex items-center gap-1.5 text-destructive font-bold">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Errors found in CSV file structure:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-destructive/80 font-mono text-[10px] max-h-[120px] overflow-y-auto">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border/40 bg-foreground/[0.005] flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                disabled={uploadingCSV}
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedFile(null);
                }}
                className="h-9 px-4 rounded-md text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                type="button"
                disabled={!selectedFile || uploadingCSV}
                onClick={handleUploadSubmit}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-md text-xs font-semibold transition-all gap-1.5 cursor-pointer"
              >
                {uploadingCSV && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Upload Events
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
