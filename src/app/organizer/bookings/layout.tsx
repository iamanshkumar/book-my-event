import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Attendee Audits - BookMyEvent",
  description: "Verify reservation ledger data, query user transaction details, and audit registrations."
};

export default function OrganizerBookingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
