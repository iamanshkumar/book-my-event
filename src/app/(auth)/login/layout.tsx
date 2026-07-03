import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Sign In - BookMyEvent",
  description: "Securely authenticate into your BookMyEvent attendee or organizer workspace."
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
