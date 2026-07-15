import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isOrganizer, isAdmin } from "@/backend/lib/role";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const couponId = parseInt(id, 10);

    if (isNaN(couponId)) {
      return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });
    }

    const headerList = await headers();
    const userIdStr = headerList.get("x-user-id");

    if (!isOrganizer(headerList) && !isAdmin(headerList)) {
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

    // Verify ownership
    const coupon = await prisma.couponCode.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    if (coupon.userId !== userId) {
      return NextResponse.json({ error: "Access denied: ownership check failed" }, { status: 403 });
    }

    const duplicate = await prisma.couponCode.findFirst({
      where: {
        userId,
        code: cleanCode,
        NOT: {
          id: couponId,
        },
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: "You already have another coupon with this code." }, { status: 400 });
    }

    const parsedLimitSame = (usageLimitSameProduct !== undefined && usageLimitSameProduct !== null && usageLimitSameProduct !== "") 
      ? parseInt(String(usageLimitSameProduct), 10) 
      : null;
    
    const parsedLimitDiff = (usageLimitDifferentProducts !== undefined && usageLimitDifferentProducts !== null && usageLimitDifferentProducts !== "") 
      ? parseInt(String(usageLimitDifferentProducts), 10) 
      : null;

    const updatedCoupon = await prisma.couponCode.update({
      where: { id: couponId },
      data: {
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

    return NextResponse.json({ coupon: updatedCoupon }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const couponId = parseInt(id, 10);

    if (isNaN(couponId)) {
      return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });
    }

    const headerList = await headers();
    const userIdStr = headerList.get("x-user-id");

    if (!isOrganizer(headerList) && !isAdmin(headerList)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const userId = parseInt(userIdStr || "", 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const coupon = await prisma.couponCode.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    if (coupon.userId !== userId) {
      return NextResponse.json({ error: "Access denied: ownership check failed" }, { status: 403 });
    }

    await prisma.couponCode.delete({
      where: { id: couponId },
    });

    return NextResponse.json({ message: "Coupon successfully deleted" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
