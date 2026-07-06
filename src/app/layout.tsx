import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans", 
});

import { getGeneralSettings } from "@/backend/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const general = await getGeneralSettings();
    console.log("Root Layout generateMetadata database value:", general);
    return {
      title: general.metaTitle || general.websiteTitle,
      description: general.metaDescription || "Find live shows, concerts, workshops, and theater events. Secure your seats and book ticket passes online.",
      icons: {
        icon: general.websiteLogo || "/favicon.ico",
      }
    };
  } catch (err) {
    console.error("Error in generateMetadata layout:", err);
    return {
      title: "BookMyEvent - Discover & Book Live Experiences",
      description: "Find live shows, concerts, workshops, and theater experiences."
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
