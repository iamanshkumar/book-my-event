import AttendeeLayoutClient from "@/components/AttendeeLayoutClient";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Attendee Dashboard - BookMyEvent",
  description: "View and manage your ticket bookings, profile settings, and digital invoice passes."
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AttendeeLayoutClient>{children}</AttendeeLayoutClient>;
}
