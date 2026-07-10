import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const headerList = await headers();
    const role = headerList.get("x-user-role");
    const userIdStr = headerList.get("x-user-id");

    if (role !== "ORGANIZER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const userId = parseInt(userIdStr || "", 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const coupons = await prisma.couponCode.findMany({
      where: { userId },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ coupons }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const role = headerList.get("x-user-role");
    const userIdStr = headerList.get("x-user-id");

    if (role !== "ORGANIZER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const userId = parseInt(userIdStr || "", 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, description, type, amount, status, startDate, endDate, eventId, usageLimitSameProduct, usageLimitDifferentProducts } = body;

    if (!name || !code || !type || amount === undefined || !startDate || !endDate || eventId === undefined) {
      return NextResponse.json({ error: "Missing mandatory fields" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check uniqueness constraint of userId + code
    const existing = await prisma.couponCode.findFirst({
      where: {
        userId,
        code: cleanCode,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "You already have a coupon with this code." }, { status: 400 });
    }

    const parsedLimitSame = (usageLimitSameProduct !== undefined && usageLimitSameProduct !== null && usageLimitSameProduct !== "") 
      ? parseInt(String(usageLimitSameProduct), 10) 
      : null;
    
    const parsedLimitDiff = (usageLimitDifferentProducts !== undefined && usageLimitDifferentProducts !== null && usageLimitDifferentProducts !== "") 
      ? parseInt(String(usageLimitDifferentProducts), 10) 
      : null;

    const newCoupon = await prisma.couponCode.create({
      data: {
        userId,
        name,
        code: cleanCode,
        description: description || null,
        type,
        amount: parseFloat(amount),
        status: status === 1 ? 1 : 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        eventId: String(eventId),
        usageLimitSameProduct: parsedLimitSame,
        usageLimitDifferentProducts: parsedLimitDiff,
      },
    });

    return NextResponse.json({ coupon: newCoupon }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
