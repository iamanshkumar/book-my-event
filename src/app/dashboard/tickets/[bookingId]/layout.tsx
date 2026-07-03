import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Ticket Invoice - BookMyEvent",
  description: "View printable digital gate passes, breakdown of seating ticket fees, and verification QR code mockups."
};

export default function TicketDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
