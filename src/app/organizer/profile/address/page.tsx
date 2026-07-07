"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Home, Phone, MapPin, Building, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

const countriesObject = countries.getNames("en", { select: "official" });
const countriesList = Object.entries(countriesObject).map(([alpha2, name]) => ({
  code: countries.alpha2ToAlpha3(alpha2) || "",
  name
})).filter(c => c.code).sort((a, b) => a.name.localeCompare(b.name));

export default function OrganizerAddressPage() {
  const [type, setType] = useState<string>("Individual");
  const [street1, setStreet1] = useState("");
  const [street2, setStreet2] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadAddress() {
      try {
        const res = await fetch("/api/organizer/settings/address");
        const data = await res.json();

        if (res.ok && data.address) {
          const addr = data.address;
          setType(addr.type || "Individual");
          setStreet1(addr.street1 || "");
          setStreet2(addr.street2 || "");
          setState(addr.state || "");
          setZipCode(addr.zipCode || "");
          setCountry(addr.country || "");
          setPhoneNumber(addr.phoneNumber || "");
        }
      } catch (err: any) {
        toast.error("Failed to load address profile details.");
      } finally {
        setLoading(false);
      }
    }
    loadAddress();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!type || !street1 || !state || !zipCode || !country || !phoneNumber) {
      toast.error("Please fill in all compulsory address fields.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/organizer/settings/address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          street1,
          street2: street2 || null,
          state,
          zipCode,
          country,
          phoneNumber
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Profile address details updated!", {
          description: "Your address details have been securely logged in the registry."
        });
        // Force session refresh so banner state updates instantly
        window.location.reload();
      } else {
        throw new Error(data.error || "Update operation failed.");
      }
    } catch (err: any) {
      toast.error("Failed to save address details", {
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

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Address Details</h2>
        <p className="text-sm text-foreground/60 font-light mt-0.5">
          Provide your address registry details below to complete your profile context.
        </p>
      </div>

      <Card className="border border-border bg-card shadow-none rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Home className="h-4 w-4 text-primary stroke-[2]" />
            Business & Address Location Info
          </CardTitle>
          <CardDescription className="text-xs text-foreground/50">
            All fields except Address Line 2 are compulsory.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSave}>
          <CardContent className="space-y-4 text-xs">
            {/* Entity Type Selection */}
            <div className="space-y-1.5">
              <Label className="text-foreground/80 font-medium">Entity Registration Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-10 bg-transparent border-border text-card-foreground">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-card-foreground">
                  <SelectItem value="Individual">Individual Host</SelectItem>
                  <SelectItem value="Company">Registered Company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Street Line 1 */}
            <div className="space-y-1.5">
              <Label htmlFor="street1" className="text-foreground/80 font-medium">Address Line 1 *</Label>
              <Input
                id="street1"
                type="text"
                placeholder="e.g. 123 Business Boulevard"
                value={street1}
                onChange={(e) => setStreet1(e.target.value)}
                required
                className="h-10 bg-transparent border-border rounded-md px-3 shadow-none text-card-foreground"
              />
            </div>

            {/* Street Line 2 */}
            <div className="space-y-1.5">
              <Label htmlFor="street2" className="text-foreground/80 font-medium">Address Line 2 (Optional)</Label>
              <Input
                id="street2"
                type="text"
                placeholder="e.g. Suite 400 / Apartment / Unit"
                value={street2}
                onChange={(e) => setStreet2(e.target.value)}
                className="h-10 bg-transparent border-border rounded-md px-3 shadow-none text-card-foreground"
              />
            </div>

            {/* State & Pincode Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-foreground/80 font-medium">State / Region *</Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="e.g. Delhi"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  className="h-10 bg-transparent border-border rounded-md px-3 shadow-none text-card-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zipCode" className="text-foreground/80 font-medium">Zip / Postal Code *</Label>
                <Input
                  id="zipCode"
                  type="text"
                  placeholder="e.g. 110001"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  required
                  className="h-10 bg-transparent border-border rounded-md px-3 shadow-none text-card-foreground"
                />
              </div>
            </div>

            {/* Country Dropdown */}
            <div className="space-y-1.5">
              <Label className="text-foreground/80 font-medium">Country *</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-10 bg-transparent border-border text-card-foreground">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-card-foreground max-h-56 overflow-y-auto">
                  {countriesList.map((c) => (
                    <SelectItem key={c.code} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber" className="text-foreground/80 font-medium">Contact Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="h-10 bg-transparent border-border rounded-md px-3 shadow-none text-card-foreground"
              />
            </div>
          </CardContent>

          <CardFooter className="pt-2 pb-6 px-6">
            <Button
              type="submit"
              disabled={saving}
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Address Details...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Save Address Details
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
