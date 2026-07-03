import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "My Tickets - BookMyEvent",
  description: "Review your purchase invoice records, booking transaction ledger, and print digital gate passes."
};

export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
