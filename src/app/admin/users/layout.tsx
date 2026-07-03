import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "User Moderation - BookMyEvent",
  description: "Manage system user directories, update profile role configurations, and audit accounts."
};

export default function AdminUsersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
