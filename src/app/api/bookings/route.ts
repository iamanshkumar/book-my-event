import { prisma } from "@/backend/lib/prisma";
import { BookingService } from "@/backend/services/BookingService";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isAttendee } from "@/backend/lib/role";

export const dynamic = 'force-dynamic';

export async function POST(request : Request){
    try{
        const headerList = await headers();
        const userIdStr = headerList.get("x-user-id");

        if (!userIdStr || !isAttendee(headerList)) {
            return NextResponse.json(
              { error: 'Forbidden. Only users with the CUSTOMER role can place event reservations.' },
              { status: 403 }
            );
        }

        const userId = parseInt(userIdStr , 10);
        const body = await request.json();
        const {ticketTierId , quantity, couponCode} = body;

        if (!ticketTierId || !quantity || quantity <= 0) {
            return NextResponse.json(
              { error: 'Mandatory fields missing or invalid. Please supply ticketTierId and quantity.' },
              { status: 400 }
            );
        }

        const newBooking = await BookingService.reserveTicket({
            userId,
            ticketTierId : parseInt(ticketTierId , 10),
            quantity : parseInt(quantity , 10),
            couponCode: couponCode || undefined
        });

        return NextResponse.json({
            message : 'Reservation initiated successfully!', booking: newBooking 
        },{
            status : 201
        })

    }catch(err : any){
        return NextResponse.json({
            error: err.message || 'An error occurred while building your booking reservation.'
        },{
            status : 500
        })
    }
}

export async function GET(){
    try{
        const headerList = await headers();
        console.log("[API /api/bookings] Received x-user-id header:", headerList.get("x-user-id"));
        const userId = parseInt(headerList.get("x-user-id") || '0' , 10);

        if(!userId){
            return NextResponse.json({
                error : "Unauthorised"
            },{
                status : 401
            });
        }

        const userBookings = await prisma.booking.findMany({
            where : {userId},
            include : {
                event : {
                    select : {eventName: true, dateTime: true, location: true, thumbnail: true, duration: true}
                },
                ticketTier : {
                    select: { tierName: true, pricePerSeatExcludingTax: true }
                }
            },
            orderBy : {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({
            bookings : userBookings
        },{
            status : 200
        });
    }catch(err : any){
        return NextResponse.json({
            error : err.message
        },{
            status : 500
        })
    }
}