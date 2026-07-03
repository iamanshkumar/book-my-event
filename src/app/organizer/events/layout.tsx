import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Manage Events - BookMyEvent",
  description: "View and edit your hosted events catalog listings and active ticketing plans."
};

export default function OrganizerEventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
