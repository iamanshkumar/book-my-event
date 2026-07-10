import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, eventId, subtotal } = body;

    if (!code || eventId === undefined || subtotal === undefined) {
      return NextResponse.json({ error: "Missing required validation parameters" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const currentEventId = parseInt(eventId, 10);
    const currentSubtotal = parseFloat(subtotal);

    const headerList = await headers();
    const userIdStr = headerList.get("x-user-id");
    const userId = userIdStr ? parseInt(userIdStr, 10) : null;

    // Look up coupon
    const coupon = await prisma.couponCode.findFirst({
      where: {
        code: cleanCode,
      },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code: Coupon does not exist." }, { status: 400 });
    }

    if (coupon.status !== 1) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code: Coupon is disabled." }, { status: 400 });
    }

    const now = new Date();
    if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code: Coupon has expired or is not yet active." }, { status: 400 });
    }

    // Check if event ID is allowed
    const allowedEventIds = coupon.eventId.split(",").map((id) => id.trim());
    if (!allowedEventIds.includes(String(currentEventId))) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code: Coupon is not valid for this event." }, { status: 400 });
    }

    // Check limits if logged in
    if (userId) {
      if (coupon.usageLimitSameProduct !== null) {
        const countSame = await prisma.couponUsage.count({
          where: {
            couponId: coupon.id,
            userId,
            productId: currentEventId,
          },
        });
        if (countSame >= coupon.usageLimitSameProduct) {
          return NextResponse.json({ valid: false, error: "Invalid coupon code: Maximum usage limit reached for this event." }, { status: 400 });
        }
      }

      if (coupon.usageLimitDifferentProducts !== null) {
        const countDiff = await prisma.couponUsage.count({
          where: {
            couponId: coupon.id,
            userId,
          },
        });
        if (countDiff >= coupon.usageLimitDifferentProducts) {
          return NextResponse.json({ valid: false, error: "Invalid coupon code: Maximum usage limit reached across events." }, { status: 400 });
        }
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === "PERCENTAGE") {
      discountAmount = currentSubtotal * (coupon.amount / 100);
    } else if (coupon.type === "FIXED") {
      discountAmount = coupon.amount;
    }

    // Cap the discount amount at the subtotal
    discountAmount = Math.min(discountAmount, currentSubtotal);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        amount: coupon.amount,
      },
      discountAmount,
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
