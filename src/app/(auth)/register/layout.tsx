import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Register - BookMyEvent",
  description: "Create an attendee account to discover and book live show ticket gate passes."
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
