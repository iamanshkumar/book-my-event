import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const headerList = await headers();
        const organizerIdStr = headerList.get("x-user-id");
        const role = headerList.get("x-user-role");

        if (!organizerIdStr || role !== "ORGANIZER") {
            return NextResponse.json({ error: "Access denied. Restricted to organizers." }, { status: 403 });
        }

        const organizerId = parseInt(organizerIdStr, 10);
        const address = await prisma.organizerAddress.findUnique({
            where: { userId: organizerId }
        });

        return NextResponse.json({ address }, { status: 200 });

    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to retrieve address details." }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const headerList = await headers();
        const organizerIdStr = headerList.get("x-user-id");
        const role = headerList.get("x-user-role");

        if (!organizerIdStr || role !== "ORGANIZER") {
            return NextResponse.json({ error: "Access denied. Restricted to organizers." }, { status: 403 });
        }

        const organizerId = parseInt(organizerIdStr, 10);
        const body = await request.json();
        const { type, street1, street2, state, zipCode, country, phoneNumber } = body;

        // Input Validations
        if (!type || !street1 || !state || !zipCode || !country || !phoneNumber) {
            return NextResponse.json({ error: "Missing required address fields." }, { status: 400 });
        }

        if (type !== "Individual" && type !== "Company") {
            return NextResponse.json({ error: "Address type must be 'Individual' or 'Company'." }, { status: 400 });
        }

        const updatedAddress = await prisma.organizerAddress.upsert({
            where: { userId: organizerId },
            update: {
                type,
                street1,
                street2: street2 || null,
                state,
                zipCode,
                country,
                phoneNumber
            },
            create: {
                userId: organizerId,
                type,
                street1,
                street2: street2 || null,
                state,
                zipCode,
                country,
                phoneNumber
            }
        });

        return NextResponse.json({
            message: "Address details updated successfully!",
            address: updatedAddress
        }, { status: 200 });

    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to save address details." }, { status: 500 });
    }
}
