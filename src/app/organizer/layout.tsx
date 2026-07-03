import OrganizerLayoutClient from "@/components/OrganizerLayoutClient";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Organizer Portal - BookMyEvent",
  description: "Create events, construct ticket pricing plans, track reservations lists, and view metrics."
};

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return <OrganizerLayoutClient>{children}</OrganizerLayoutClient>;
}
