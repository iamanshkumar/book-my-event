import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Organizer Registration - BookMyEvent",
  description: "Create an event host account to schedule and manage custom seating configurations."
};

export default function OrganizerRegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
