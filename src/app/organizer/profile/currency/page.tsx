"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Coins, Check, Search, X } from "lucide-react";
import cc from "currency-codes";

interface CurrencyItem {
  code: string;
  name: string;
}

// Fetch sorted currencies list using library
const SUPPORTED_CURRENCIES: CurrencyItem[] = cc.data
  .map((curr) => ({
    code: curr.code,
    name: curr.currency,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function CurrencySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allowedCurrencies, setAllowedCurrencies] = useState<string[]>(["INR"]);
  const [defaultCurrency, setDefaultCurrency] = useState("INR");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadCurrencySettings() {
      try {
        const res = await fetch("/api/organizer/settings/currency");
        const data = await res.json();
        if (res.ok) {
          setAllowedCurrencies(data.allowedCurrencies || ["INR"]);
          setDefaultCurrency(data.defaultCurrency || "INR");
        }
      } catch (err) {
        toast.error("Failed to load currency configurations.");
      } finally {
        setLoading(false);
      }
    }
    loadCurrencySettings();
  }, []);

  const handleToggleCurrency = (curr: string) => {
    setAllowedCurrencies((prev) => {
      if (prev.includes(curr)) {
        if (prev.length === 1) {
          toast.error("You must have at least one allowed currency.");
          return prev;
        }
        const filtered = prev.filter((c) => c !== curr);
        if (defaultCurrency === curr && filtered.length > 0) {
          setDefaultCurrency(filtered[0]);
        }
        return filtered;
      } else {
        if (prev.length >= 5) {
          toast.error("You can choose up to 5 allowed currencies maximum.");
          return prev;
        }
        return [...prev, curr];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const toastId = toast.loading("Updating currency settings...");
    try {
      const res = await fetch("/api/organizer/settings/currency", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowedCurrencies, defaultCurrency }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Currency settings successfully updated!", {
          id: toastId,
        });
      } else {
        throw new Error(data.error || "Failed to update configurations.");
      }
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-xs text-foreground/50">
          Loading configurations...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Currency Preferences
        </h2>
        <p className="text-xs text-foreground/60">
          Configure the transaction currencies you accept. Choose up to 5
          currencies.
        </p>
      </div>

      <Card className="border border-border bg-card shadow-none p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-1.5 uppercase text-foreground/55">
            <Coins className="h-4 w-4" /> Allowed Currencies
          </CardTitle>
          <CardDescription className="text-[11px]">
            Tick checkbox options to add or remove allowed payment methods (max
            5).
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 space-y-6">
          {/* Selected Badges */}
          <div className="flex flex-wrap gap-2 p-3 bg-foreground/[0.015] border border-border/40 rounded-lg">
            <span className="text-[10px] text-foreground/45 uppercase font-bold shrink-0 self-center mr-2">
              Selected:
            </span>
            {allowedCurrencies.map((curr) => {
              const details = SUPPORTED_CURRENCIES.find((c) => c.code === curr);
              return (
                <div
                  key={curr}
                  className="bg-primary/10 border border-primary/20 text-foreground text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5"
                >
                  <span>
                    {curr} ({details?.name || ""})
                  </span>
                  {curr !== defaultCurrency && (
                    <button
                      onClick={() => handleToggleCurrency(curr)}
                      className="text-foreground/40 hover:text-foreground/75 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {curr === defaultCurrency && (
                    <span className="text-[9px] uppercase font-bold text-primary font-mono ml-1.5">
                      (Default)
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-foreground/30" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by currency code or name..."
              className="pl-9 h-10 bg-transparent border-border/60 shadow-none text-xs"
            />
          </div>

          {/* List display */}
          <div className="border border-border/40 rounded-lg max-h-[220px] overflow-y-auto divide-y divide-border/20">
            {filteredCurrencies.length === 0 ? (
              <div className="p-8 text-center text-foreground/45 text-xs">
                No matching currencies found.
              </div>
            ) : (
              filteredCurrencies.map((curr) => {
                const isSelected = allowedCurrencies.includes(curr.code);
                return (
                  <div
                    key={curr.code}
                    onClick={() => handleToggleCurrency(curr.code)}
                    className={`p-3 cursor-pointer flex items-center justify-between text-xs transition-colors hover:bg-foreground/[0.015] ${
                      isSelected ? "bg-primary/5 font-semibold" : "font-normal"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-foreground">{curr.name}</span>
                      <span className="text-[10px] text-foreground/40 ml-2 font-mono">
                        {curr.code}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Default Selector */}
          <div className="space-y-2 border-t border-border/40 pt-5">
            <Label className="text-xs font-bold text-foreground/75">
              Default Event Currency
            </Label>
            <p className="text-[11px] text-foreground/45 mt-0.5 leading-snug">
              Newly created events will default to this selection. Must be one
              of your active allowed currencies.
            </p>
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 mt-2 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {allowedCurrencies.map((c) => {
                const details = SUPPORTED_CURRENCIES.find(
                  (curr) => curr.code === c,
                );
                return (
                  <option key={c} value={c}>
                    {c} - {details?.name || c}
                  </option>
                );
              })}
            </select>
          </div>

          <Button
            disabled={saving}
            onClick={handleSave}
            className="mt-4 w-full h-10 font-semibold text-xs cursor-pointer"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
