import { prisma } from "@/backend/lib/prisma";
import type { Metadata } from "next";
import React from "react";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const eventId = parseInt(id, 10);
  if (isNaN(eventId)) {
    return { title: "Event Details - BookMyEvent" };
  }
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });
  if (!event) {
    return { title: "Event Not Found - BookMyEvent" };
  }
  return {
    title: `${event.eventName} - BookMyEvent`,
    description: event.description || "Book your tickets for this live experience on BookMyEvent."
  };
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
