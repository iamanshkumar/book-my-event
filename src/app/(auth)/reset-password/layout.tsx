import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Reset Password - BookMyEvent",
  description: "Establish a new secure access credential password configuration."
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
