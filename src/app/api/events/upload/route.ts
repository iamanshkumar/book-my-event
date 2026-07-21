import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { EventCategory, Prisma } from "@prisma/client";
import { isOrganizer, isAdmin } from "@/backend/lib/role";

export const dynamic = 'force-dynamic';

function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(cell.trim());
        cell = "";
      } else if (char === "\n" || char === "\r") {
        row.push(cell.trim());
        if (row.some((c) => c !== "")) {
          lines.push(row);
        }
        row = [];
        cell = "";
        if (char === "\r" && nextChar === "\n") {
          i++; 
        }
      } else {
        cell += char;
      }
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c !== "")) {
      lines.push(row);
    }
  }

  return lines;
}

export async function POST(req: NextRequest) {
  try {
    const headerList = await headers();
    const userIdStr = headerList.get("x-user-id");

    if (!isOrganizer(headerList) && !isAdmin(headerList)) {
      return NextResponse.json(
        { error: "Access denied. Only organizers can bulk upload." },
        { status: 403 },
      );
    }

    const organizerId = parseInt(userIdStr || "", 10);
    if (isNaN(organizerId)) {
      return NextResponse.json(
        { error: "Invalid user session." },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file was uploaded." },
        { status: 400 },
      );
    }

    const fileContent = await file.text();
    const parsedRows = parseCSV(fileContent);

    if (parsedRows.length <= 1) {
      return NextResponse.json(
        { error: "CSV file is empty or missing data rows." },
        { status: 400 },
      );
    }

    const headersRow = parsedRows[0].map((h) => h.toLowerCase().trim());

    const getIndex = (name: string) => headersRow.indexOf(name);

    const nameIdx = getIndex("event_name");
    const descIdx = getIndex("description");
    const locIdx = getIndex("location");
    const countryIdx = getIndex("country");
    const pinIdx = getIndex("pincode");
    const dateIdx = getIndex("date_time");
    const durIdx = getIndex("duration");
    const catIdx = getIndex("category");
    const tierNameIdx = getIndex("tier_name");
    const seatsIdx = getIndex("total_seats");
    const priceIdx = getIndex("price_per_seat");
    const taxIdx = getIndex("tax_percentage");

    // Validate headers
    if (
      nameIdx === -1 ||
      locIdx === -1 ||
      dateIdx === -1 ||
      durIdx === -1 ||
      tierNameIdx === -1 ||
      seatsIdx === -1 ||
      priceIdx === -1
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required headers. Headers must include: event_name, location, date_time, duration, tier_name, total_seats, price_per_seat",
        },
        { status: 400 },
      );
    }

    const dataRows = parsedRows.slice(1);
    const errors: string[] = [];
    const eventGroups: Record<
      string,
      {
        eventName: string;
        description: string;
        location: string;
        country: string;
        pincode: string;
        dateTime: Date;
        duration: string;
        category: EventCategory;
        tiers: {
          tierName: string;
          totalSeats: number;
          pricePerSeat: number;
          taxPercentage: number;
        }[];
      }
    > = {};

    dataRows.forEach((row, index) => {
      const lineNum = index + 2; 

      const eventName = row[nameIdx]?.trim();
      const location = row[locIdx]?.trim();
      const dateTimeStr = row[dateIdx]?.trim();
      const duration = row[durIdx]?.trim();

      if (!eventName || !location || !dateTimeStr || !duration) {
        errors.push(
          `Row ${lineNum}: Missing required event fields (event_name, location, date_time, duration).`,
        );
        return;
      }

      const dateTime = new Date(dateTimeStr);
      if (isNaN(dateTime.getTime())) {
        errors.push(
          `Row ${lineNum}: Invalid date_time format "${dateTimeStr}". Use ISO string format (e.g. YYYY-MM-DDTHH:MM:SSZ).`,
        );
        return;
      }

      const rawCategory = row[catIdx]?.toUpperCase().trim();
      let category: EventCategory = EventCategory.OTHER;
      if (rawCategory) {
        if (
          Object.values(EventCategory).includes(rawCategory as EventCategory)
        ) {
          category = rawCategory as EventCategory;
        } else {
          errors.push(
            `Row ${lineNum}: Invalid category "${rawCategory}". Must be one of: ${Object.values(EventCategory).join(", ")}.`,
          );
          return;
        }
      }

      const tierName = row[tierNameIdx]?.trim();
      const totalSeats = parseInt(row[seatsIdx] || "", 10);
      const pricePerSeat = parseFloat(row[priceIdx] || "");
      const taxPercentage = parseFloat(row[taxIdx] || "0");

      if (!tierName) {
        errors.push(`Row ${lineNum}: Missing tier_name.`);
        return;
      }
      if (isNaN(totalSeats) || totalSeats <= 0) {
        errors.push(`Row ${lineNum}: total_seats must be a positive integer.`);
        return;
      }
      if (isNaN(pricePerSeat) || pricePerSeat < 0) {
        errors.push(
          `Row ${lineNum}: price_per_seat must be a non-negative number.`,
        );
        return;
      }
      if (isNaN(taxPercentage) || taxPercentage < 0 || taxPercentage > 100) {
        errors.push(
          `Row ${lineNum}: tax_percentage must be a valid percentage (0-100).`,
        );
        return;
      }

      const groupKey = `${eventName.toLowerCase()}_${location.toLowerCase()}_${dateTime.getTime()}`;

      if (!eventGroups[groupKey]) {
        eventGroups[groupKey] = {
          eventName,
          description: descIdx !== -1 ? row[descIdx]?.trim() || "" : "",
          location,
          country: countryIdx !== -1 ? row[countryIdx]?.trim() || "IND" : "IND",
          pincode: pinIdx !== -1 ? row[pinIdx]?.trim() || "" : "",
          dateTime,
          duration,
          category,
          tiers: [],
        };
      }

      const existingTier = eventGroups[groupKey].tiers.find(
        (t) => t.tierName.toLowerCase() === tierName.toLowerCase(),
      );
      if (existingTier) {
        errors.push(
          `Row ${lineNum}: Duplicate ticket tier name "${tierName}" found for event "${eventName}".`,
        );
        return;
      }

      eventGroups[groupKey].tiers.push({
        tierName,
        totalSeats,
        pricePerSeat,
        taxPercentage,
      });
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 },
      );
    }

    const eventsToCreate = Object.values(eventGroups);
    if (eventsToCreate.length === 0) {
      return NextResponse.json(
        { error: "No valid events were parsed." },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let createdEventsCount = 0;
      let createdTiersCount = 0;

      for (const ev of eventsToCreate) {
        const createdEvent = await tx.event.create({
          data: {
            organizerId,
            eventName: ev.eventName,
            description: ev.description || null,
            location: ev.location,
            country: ev.country,
            pincode: ev.pincode || null,
            dateTime: ev.dateTime,
            duration: ev.duration,
            category: ev.category,
            status: "PUBLISHED",
          },
        });

        createdEventsCount++;

        for (const tier of ev.tiers) {
          await tx.ticketTier.create({
            data: {
              eventId: createdEvent.id,
              tierName: tier.tierName,
              totalSeats: tier.totalSeats,
              availableSeats: tier.totalSeats,
              pricePerSeatExcludingTax: tier.pricePerSeat,
              taxPercentage: tier.taxPercentage,
            },
          });
          createdTiersCount++;
        }
      }

      return { createdEventsCount, createdTiersCount };
    });

    return NextResponse.json(
      {
        message: "Bulk upload completed successfully!",
        eventsCreated: result.createdEventsCount,
        tiersCreated: result.createdTiersCount,
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err.message || "An unexpected error occurred during bulk processing.",
      },
      { status: 500 },
    );
  }
}
