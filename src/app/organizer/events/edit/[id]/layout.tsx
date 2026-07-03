import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Edit Event Specifications - BookMyEvent",
  description: "Update details for active experience listings, change seating allocations, and modify pricing configurations."
};

export default function EditEventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
