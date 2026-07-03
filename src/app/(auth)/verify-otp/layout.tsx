import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Verify OTP - BookMyEvent",
  description: "Verify the safety code dispatched to your email address."
};

export default function VerifyOtpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
