"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, Plus, Pencil, Trash2, Calendar, Ticket, Loader2, X, AlertTriangle, CheckSquare, Square
} from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: number;
  name: string;
  code: string;
  description: string | null;
  type: string;
  amount: number;
  status: number;
  startDate: string;
  endDate: string;
  eventId: string;
}

interface EventData {
  id: number;
  eventName: string;
  status: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("FIXED");
  const [formAmount, setFormAmount] = useState("");
  const [formStatus, setFormStatus] = useState(1);
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);

  // Multi-select dropdown state
  const [eventSelectOpen, setEventSelectOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [couponsRes, eventsRes] = await Promise.all([
        fetch("/api/organizer/coupons"),
        fetch("/api/organizer/events"),
      ]);

      if (couponsRes.ok) {
        const couponsData = await couponsRes.json();
        setCoupons(couponsData.coupons || []);
      }
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        // Filter out CANCELLED events
        const activeEvents = (eventsData.events || []).filter(
          (e: EventData) => e.status !== "CANCELLED"
        );
        setEvents(activeEvents);
      }
    } catch (e: any) {
      toast.error("Failed to load settings configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingCoupon(null);
    setFormName("");
    setFormCode("");
    setFormDescription("");
    setFormType("FIXED");
    setFormAmount("");
    setFormStatus(1);
    
    // Default dates (start = now, end = 1 week from now)
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 7);
    
    // Format to YYYY-MM-DDTHH:MM
    const toDatetimeLocal = (date: Date) => {
      const pad = (num: number) => String(num).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    setFormStartDate(toDatetimeLocal(now));
    setFormEndDate(toDatetimeLocal(future));
    setSelectedEventIds([]);
    setEventSelectOpen(false);
    setModalOpen(true);
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormName(coupon.name);
    setFormCode(coupon.code);
    setFormDescription(coupon.description || "");
    setFormType(coupon.type);
    setFormAmount(String(coupon.amount));
    setFormStatus(coupon.status);

    const toDatetimeLocal = (dateStr: string) => {
      const date = new Date(dateStr);
      const pad = (num: number) => String(num).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    setFormStartDate(toDatetimeLocal(coupon.startDate));
    setFormEndDate(toDatetimeLocal(coupon.endDate));
    
    const ids = coupon.eventId
      ? coupon.eventId.split(",").map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id))
      : [];
    setSelectedEventIds(ids);
    setEventSelectOpen(false);
    setModalOpen(true);
  };

  const toggleEventSelection = (eventId: number) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formCode.trim() || !formAmount || !formStartDate || !formEndDate) {
      toast.error("Missing mandatory fields.");
      return;
    }

    if (selectedEventIds.length === 0) {
      toast.error("Please select at least one associated event.");
      return;
    }

    const payload = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      description: formDescription.trim(),
      type: formType,
      amount: parseFloat(formAmount),
      status: formStatus,
      startDate: new Date(formStartDate).toISOString(),
      endDate: new Date(formEndDate).toISOString(),
      eventId: selectedEventIds.join(","),
    };

    const isEdit = !!editingCoupon;
    const url = isEdit ? `/api/organizer/coupons/${editingCoupon.id}` : "/api/organizer/coupons";
    const method = isEdit ? "PUT" : "POST";
    const loadingToast = toast.loading(isEdit ? "Saving changes..." : "Creating coupon code...");

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Save operation failed.");
      }

      toast.success(isEdit ? "Coupon updated successfully!" : "Coupon created successfully!", {
        id: loadingToast,
      });

      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  const handleDelete = async (couponId: number, couponCode: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete coupon code ${couponCode}?`);
    if (!confirmDelete) return;

    const loadingToast = toast.loading(`Deleting coupon ${couponCode}...`);
    try {
      const res = await fetch(`/api/organizer/coupons/${couponId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Delete operation failed.");
      }

      toast.success("Coupon code deleted successfully!", { id: loadingToast });
      fetchData();
    } catch (err: any) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  const getEventNamesList = (commaIds: string) => {
    if (!commaIds) return "No events selected";
    const ids = commaIds.split(",").map((id) => parseInt(id.trim(), 10));
    const matching = events.filter((e) => ids.includes(e.id));
    if (matching.length === 0) return "No active events";
    if (matching.length <= 2) return matching.map((e) => e.eventName).join(", ");
    return `${matching[0].eventName}, ${matching[1].eventName} + ${matching.length - 2} more`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-xs text-foreground/50">Fetching coupons ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Coupon Codes
          </h2>
          <p className="text-xs text-foreground/60 mt-1">
            Create and manage promotional discount codes for your scheduled events.
          </p>
        </div>

        <Button onClick={handleOpenAddModal} className="h-9 px-4 font-semibold text-xs gap-1.5 cursor-pointer">
          <Plus className="h-4 w-4" /> Add Coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <Card className="border border-dashed border-border p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center">
            <Ticket className="h-5 w-5 text-primary/60" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">No coupons configured</h3>
            <p className="text-xs text-foreground/50 max-w-sm mt-1">
              Add discount codes for attendee checkouts to drive event ticket reservations.
            </p>
          </div>
          <Button onClick={handleOpenAddModal} variant="outline" className="h-8.5 px-3.5 text-xs font-semibold mt-2 cursor-pointer">
            Create First Coupon
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => {
            const isExpired = new Date() > new Date(coupon.endDate);
            const isFuture = new Date() < new Date(coupon.startDate);
            const isActive = coupon.status === 1 && !isExpired && !isFuture;

            return (
              <Card key={coupon.id} className="border border-border/80 bg-card overflow-hidden shadow-none flex flex-col justify-between">
                <CardHeader className="p-5 border-b border-border/40 bg-foreground/[0.005]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold tracking-tight text-sm uppercase px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      {coupon.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive 
                        ? "bg-green-500/10 text-green-500 border border-green-500/10" 
                        : isExpired
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/10"
                          : coupon.status === 0
                            ? "bg-zinc-500/10 text-zinc-500 border border-zinc-500/10"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/10"
                    }`}>
                      {isActive 
                        ? "Active" 
                        : isExpired 
                          ? "Expired" 
                          : coupon.status === 0 
                            ? "Disabled" 
                            : "Scheduled"}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-bold tracking-tight mt-3 text-card-foreground">
                    {coupon.name}
                  </CardTitle>
                  {coupon.description && (
                    <CardDescription className="text-xs font-light text-foreground/60 line-clamp-2 mt-1">
                      {coupon.description}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="p-5 flex-grow space-y-3.5 text-xs text-foreground/75">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/45 font-medium">Type:</span>
                    <span className="font-semibold text-foreground">
                      {coupon.type === "PERCENTAGE" ? "Percentage Off" : "Fixed Discount"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-foreground/45 font-medium">Discount Value:</span>
                    <span className="font-semibold text-foreground text-sm">
                      {coupon.type === "PERCENTAGE" ? `${coupon.amount}%` : `${coupon.amount} unit`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-foreground/45 font-medium">Validity:</span>
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-foreground/40" />
                      {new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-3 border-t border-border/40 pt-3">
                    <span className="text-foreground/45 font-medium shrink-0">Events:</span>
                    <span className="font-medium text-foreground text-right leading-tight">
                      {getEventNamesList(coupon.eventId)}
                    </span>
                  </div>
                </CardContent>

                <div className="p-4 border-t border-border/40 bg-foreground/[0.005] flex items-center justify-end gap-2.5">
                  <Button 
                    onClick={() => handleOpenEditModal(coupon)} 
                    variant="ghost" 
                    className="h-8.5 px-3 text-xs font-medium text-foreground/70 hover:bg-foreground/5 cursor-pointer border-none"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button 
                    onClick={() => handleDelete(coupon.id, coupon.code)} 
                    variant="ghost" 
                    className="h-8.5 px-3 text-xs font-medium text-destructive hover:bg-destructive/10 cursor-pointer border-none"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE & EDIT FORM MODAL CONTAINER */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border border-border shadow-lg bg-card max-h-[90vh] flex flex-col">
            <header className="p-6 border-b border-border/40 flex items-center justify-between shrink-0">
              <div>
                <CardTitle className="text-lg font-bold tracking-tight">
                  {editingCoupon ? "Edit Coupon Details" : "Add New Coupon Code"}
                </CardTitle>
                <CardDescription className="text-xs font-light text-foreground/50 mt-1">
                  Configure discount value, date ranges, and allowed events.
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setModalOpen(false)} 
                className="h-8 w-8 text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-full cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </header>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="couponName" className="text-xs font-semibold text-foreground/75">
                    Coupon Name
                  </Label>
                  <Input
                    id="couponName"
                    value={formName}
                    placeholder="E.g., Special Summer Discount"
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="couponCode" className="text-xs font-semibold text-foreground/75">
                    Coupon Code
                  </Label>
                  <Input
                    id="couponCode"
                    value={formCode}
                    placeholder="E.g., SUMMER10"
                    onChange={(e) => setFormCode(e.target.value)}
                    required
                    className="uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="couponDesc" className="text-xs font-semibold text-foreground/75">
                  Description
                </Label>
                <textarea
                  id="couponDesc"
                  value={formDescription}
                  placeholder="Optional details regarding coupon eligibility criteria..."
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full min-h-[60px] bg-transparent border border-border rounded-md px-3 py-2 text-sm placeholder:text-foreground/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="couponType" className="text-xs font-semibold text-foreground/75">
                    Discount Type
                  </Label>
                  <select
                    id="couponType"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full bg-background border border-border text-foreground text-sm rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="FIXED">Fixed Amount Discount</option>
                    <option value="PERCENTAGE">Percentage Discount</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="couponAmount" className="text-xs font-semibold text-foreground/75">
                    Discount Value ({formType === "PERCENTAGE" ? "%" : "Amount"})
                  </Label>
                  <Input
                    id="couponAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formAmount}
                    placeholder={formType === "PERCENTAGE" ? "E.g., 10" : "E.g., 50.00"}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="couponStart" className="text-xs font-semibold text-foreground/75">
                    Start Validity Date & Time
                  </Label>
                  <Input
                    id="couponStart"
                    type="datetime-local"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="couponEnd" className="text-xs font-semibold text-foreground/75">
                    End Validity Date & Time
                  </Label>
                  <Input
                    id="couponEnd"
                    type="datetime-local"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Toggle Status switch field */}
              <div className="flex items-center gap-3 py-1 bg-foreground/[0.01] border border-border/40 p-3 rounded-lg">
                <input
                  type="checkbox"
                  id="couponStatus"
                  checked={formStatus === 1}
                  onChange={(e) => setFormStatus(e.target.checked ? 1 : 0)}
                  className="h-4.5 w-4.5 rounded border-border accent-primary cursor-pointer shrink-0"
                />
                <Label htmlFor="couponStatus" className="text-xs font-semibold text-foreground/80 cursor-pointer select-none">
                  Enable coupon for use immediately (Status = Active)
                </Label>
              </div>

              {/* Multi-select active events section */}
              <div className="space-y-1.5 relative">
                <Label className="text-xs font-semibold text-foreground/75 block">
                  Eligible Events
                </Label>
                
                <div 
                  onClick={() => setEventSelectOpen(!eventSelectOpen)}
                  className="w-full bg-transparent border border-border rounded-md px-3 py-2.5 text-sm cursor-pointer select-none flex items-center justify-between hover:bg-foreground/[0.01]"
                >
                  <span className="truncate text-foreground/80">
                    {selectedEventIds.length === 0 
                      ? "Select associated events..."
                      : `${selectedEventIds.length} event(s) selected`}
                  </span>
                  <span className="text-[10px] text-foreground/40 font-semibold uppercase">
                    {eventSelectOpen ? "Close" : "Open"}
                  </span>
                </div>

                {eventSelectOpen && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 border border-border bg-card rounded-md shadow-md max-h-[160px] overflow-y-auto p-2 space-y-1">
                    {events.length === 0 ? (
                      <p className="text-[11px] text-foreground/45 text-center py-3">No active events found.</p>
                    ) : (
                      events.map((e) => {
                        const isChecked = selectedEventIds.includes(e.id);
                        return (
                          <div 
                            key={e.id}
                            onClick={() => toggleEventSelection(e.id)}
                            className="flex items-center gap-2 p-1.5 hover:bg-foreground/5 rounded cursor-pointer select-none text-xs"
                          >
                            {isChecked ? (
                              <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <Square className="h-4 w-4 text-foreground/30 shrink-0" />
                            )}
                            <span className="truncate font-medium">{e.eventName}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <footer className="pt-4 mt-6 border-t border-border/40 flex items-center justify-end gap-3 shrink-0">
                <Button 
                  type="button" 
                  onClick={() => setModalOpen(false)} 
                  variant="outline" 
                  className="h-9 px-4 font-semibold text-xs border-border hover:bg-foreground/5 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="h-9 px-4 font-semibold text-xs cursor-pointer"
                >
                  Save Coupon
                </Button>
              </footer>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
