import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Event Bookings - BookMyEvent",
  description: "Verify reservation ledger data, query user transaction details, and manage event bookings."
};

export default function OrganizerBookingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
