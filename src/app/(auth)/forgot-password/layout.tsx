import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Forgot Password - BookMyEvent",
  description: "Initiate an OTP credential reset flow for your BookMyEvent account access."
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
