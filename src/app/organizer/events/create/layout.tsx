import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Schedule Event - BookMyEvent",
  description: "Configure event dates, venues, local banners/thumbnails, teaser videos, and seating configurations."
};

export default function CreateEventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
