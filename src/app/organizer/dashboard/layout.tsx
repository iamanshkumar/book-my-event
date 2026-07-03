import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Organizer Dashboard - BookMyEvent",
  description: "Analyze event metrics, overall billing metrics, seat capacities, and ticketing parameters."
};

export default function OrganizerDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
