import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Admin Portal - BookMyEvent",
  description: "Monitor platform-wide analytics, system billing diagnostics, and moderated listings."
};

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
