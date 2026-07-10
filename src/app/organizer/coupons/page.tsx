"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, Plus, Pencil, Trash2, Calendar, Ticket, Loader2, X, CheckSquare, Square 
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
  usageLimitSameProduct?: number | null;
  usageLimitDifferentProducts?: number | null;
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
  
  // New fields
  const [usageLimitSameProduct, setUsageLimitSameProduct] = useState("");
  const [usageLimitDifferentProducts, setUsageLimitDifferentProducts] = useState("");

  // Filters and Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
    setUsageLimitSameProduct("");
    setUsageLimitDifferentProducts("");
    
    // Default dates (start = now, end = 1 week from now)
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 7);
    
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
    setUsageLimitSameProduct(coupon.usageLimitSameProduct !== null && coupon.usageLimitSameProduct !== undefined ? String(coupon.usageLimitSameProduct) : "");
    setUsageLimitDifferentProducts(coupon.usageLimitDifferentProducts !== null && coupon.usageLimitDifferentProducts !== undefined ? String(coupon.usageLimitDifferentProducts) : "");

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
      usageLimitSameProduct: usageLimitSameProduct ? parseInt(usageLimitSameProduct, 10) : null,
      usageLimitDifferentProducts: usageLimitDifferentProducts ? parseInt(usageLimitDifferentProducts, 10) : null,
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

  const getCouponStatus = (coupon: Coupon) => {
    const isExpired = new Date() > new Date(coupon.endDate);
    const isFuture = new Date() < new Date(coupon.startDate);
    if (coupon.status === 0) return "DISABLED";
    if (isExpired) return "EXPIRED";
    if (isFuture) return "SCHEDULED";
    return "ACTIVE";
  };

  // Matching and filtering logic
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch = 
      coupon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter !== "ALL") {
      const status = getCouponStatus(coupon);
      if (status !== statusFilter) return false;
    }

    if (startDateFilter) {
      const filterDate = new Date(startDateFilter);
      const couponStart = new Date(coupon.startDate);
      if (couponStart < filterDate) return false;
    }

    if (endDateFilter) {
      const filterDate = new Date(endDateFilter);
      const couponEnd = new Date(coupon.endDate);
      if (couponEnd > filterDate) return false;
    }

    return true;
  });

  const totalItems = filteredCoupons.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedCoupons = filteredCoupons.slice(startIndex, startIndex + itemsPerPage);

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

      {/* Filters and Search toolbar */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5 bg-card border border-border p-4 rounded-xl shadow-xs">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="search" className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Search</Label>
          <Input 
            id="search" 
            placeholder="Search by code or name..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="h-9 px-3 text-xs bg-transparent shadow-none"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="statusFilter" className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Status</Label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full bg-background border border-border text-foreground text-xs rounded-md px-3 h-9 focus:outline-none focus:ring-1 focus:ring-primary shadow-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="DISABLED">Disabled</option>
            <option value="SCHEDULED">Scheduled</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startDateFilter" className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">Start Date</Label>
          <Input 
            id="startDateFilter" 
            type="date"
            value={startDateFilter}
            onChange={(e) => { setStartDateFilter(e.target.value); setCurrentPage(1); }}
            className="h-9 px-3 text-xs bg-transparent shadow-none"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDateFilter" className="text-[10px] uppercase font-bold tracking-wider text-foreground/50">End Date</Label>
          <Input 
            id="endDateFilter" 
            type="date"
            value={endDateFilter}
            onChange={(e) => { setEndDateFilter(e.target.value); setCurrentPage(1); }}
            className="h-9 px-3 text-xs bg-transparent shadow-none"
          />
        </div>
      </div>

      {filteredCoupons.length === 0 ? (
        <Card className="border border-dashed border-border p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center">
            <Ticket className="h-5 w-5 text-primary/60" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">No coupons found</h3>
            <p className="text-xs text-foreground/50 max-w-sm mt-1">
              Add discount codes for attendee checkouts or try adjusting your search filters.
            </p>
          </div>
          {coupons.length === 0 && (
            <Button onClick={handleOpenAddModal} variant="outline" className="h-8.5 px-3.5 text-xs font-semibold mt-2 cursor-pointer">
              Create First Coupon
            </Button>
          )}
        </Card>
      ) : (
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-foreground/[0.015] border-b border-border/60 text-foreground/60 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Code</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Type / Value</th>
                  <th className="p-4">Validity Period</th>
                  <th className="p-4">Per User Limit (Same/Diff)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedCoupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  const isPercentage = coupon.type === "PERCENTAGE";

                  return (
                    <tr key={coupon.id} className="hover:bg-foreground/[0.005] transition-colors">
                      <td className="p-4 font-semibold">
                        <span className="font-bold tracking-tight uppercase px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                          {coupon.code}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-foreground">{coupon.name}</div>
                        {coupon.description && (
                          <div className="text-[10px] text-foreground/50 truncate max-w-[200px]" title={coupon.description}>
                            {coupon.description}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-foreground">
                        <div>{isPercentage ? "Percentage" : "Fixed amount"}</div>
                        <div className="text-[10px] text-foreground/50 font-bold">
                          {isPercentage ? `${coupon.amount}%` : `${coupon.amount} unit`}
                        </div>
                      </td>
                      <td className="p-4 text-foreground/80 font-medium">
                        <div>From: {new Date(coupon.startDate).toLocaleDateString()}</div>
                        <div>To: {new Date(coupon.endDate).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 font-medium text-foreground/85">
                        <div>Same Product: <span className="font-semibold text-foreground">{coupon.usageLimitSameProduct !== null && coupon.usageLimitSameProduct !== undefined ? coupon.usageLimitSameProduct : "Unlimited"}</span></div>
                        <div>Across Events: <span className="font-semibold text-foreground">{coupon.usageLimitDifferentProducts !== null && coupon.usageLimitDifferentProducts !== undefined ? coupon.usageLimitDifferentProducts : "Unlimited"}</span></div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          status === "ACTIVE" 
                            ? "bg-green-500/10 text-green-500 border border-green-500/10" 
                            : status === "EXPIRED"
                              ? "bg-rose-500/10 text-rose-500 border border-rose-500/10"
                              : status === "DISABLED"
                                ? "bg-zinc-500/10 text-zinc-500 border border-zinc-500/10"
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/10"
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1 shrink-0">
                        <Button 
                          onClick={() => handleOpenEditModal(coupon)} 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-foreground/60 hover:bg-foreground/5 cursor-pointer border-none"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          onClick={() => handleDelete(coupon.id, coupon.code)} 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer border-none"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border/40 flex items-center justify-between text-xs text-foreground/60 bg-foreground/[0.005]">
              <span>
                Showing page {activePage} of {totalPages} ({totalItems} total coupons)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={activePage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="h-8 px-2 text-[10px] font-semibold border-border disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant={activePage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-8 w-8 text-[10px] font-semibold p-0 ${activePage === i + 1 ? "" : "border-border"} cursor-pointer`}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={activePage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="h-8 px-2 text-[10px] font-semibold border-border disabled:opacity-40 cursor-pointer"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
                  Configure discount value, date ranges, limits, and allowed events.
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

              {/* Usage Limit Fields */}
              <div className="grid gap-4 sm:grid-cols-2 border-t border-border/40 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="usageLimitSameProduct" className="text-xs font-semibold text-foreground/75">
                    Usage Limit (Same Event)
                  </Label>
                  <Input
                    id="usageLimitSameProduct"
                    type="number"
                    min="1"
                    step="1"
                    value={usageLimitSameProduct}
                    placeholder="Unlimited"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d+$/.test(val)) {
                        setUsageLimitSameProduct(val);
                      }
                    }}
                    className="shadow-none"
                  />
                  <p className="text-[10px] text-foreground/40 font-light">Max coupon uses per user for the same event.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="usageLimitDifferentProducts" className="text-xs font-semibold text-foreground/75">
                    Usage Limit (Across Events)
                  </Label>
                  <Input
                    id="usageLimitDifferentProducts"
                    type="number"
                    min="1"
                    step="1"
                    value={usageLimitDifferentProducts}
                    placeholder="Unlimited"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d+$/.test(val)) {
                        setUsageLimitDifferentProducts(val);
                      }
                    }}
                    className="shadow-none"
                  />
                  <p className="text-[10px] text-foreground/40 font-light">Max coupon uses per user across different events.</p>
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
