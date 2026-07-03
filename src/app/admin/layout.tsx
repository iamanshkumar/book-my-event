import AdminLayoutClient from "@/components/AdminLayoutClient";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Admin Panel - BookMyEvent",
  description: "Monitor platform users directory, hosted events catalog statistics, and moderate contents."
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
