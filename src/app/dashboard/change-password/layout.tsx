import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Change Password - BookMyEvent",
  description: "Update and manage your attendee account security credentials."
};

export default function ChangePasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
