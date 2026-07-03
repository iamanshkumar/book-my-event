import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "My Profile - BookMyEvent",
  description: "Manage your BookMyEvent attendee profile information, name, and email configurations."
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
