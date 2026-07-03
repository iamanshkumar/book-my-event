import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Event Moderation - BookMyEvent",
  description: "Administrative moderation panel to manage active catalog listings and verify platform compliance."
};

export default function AdminEventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
