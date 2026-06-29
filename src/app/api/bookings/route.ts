import { BookingService } from "@/backend/services/BookingService";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request : Request){
    try{
        const headerList = await headers();
        const userIdStr = headerList.get("x-user-id");
        const userRole = headerList.get("x-user-role");

        if (!userIdStr || userRole !== 'CUSTOMER') {
            return NextResponse.json(
              { error: 'Forbidden. Only users with the CUSTOMER role can place event reservations.' },
              { status: 403 }
            );
        }

        const userId = parseInt(userIdStr , 10);
        const body = await request.json();
        const {ticketTierId , quantity} = body;

        if (!ticketTierId || !quantity || quantity <= 0) {
            return NextResponse.json(
              { error: 'Mandatory fields missing or invalid. Please supply ticketTierId and quantity.' },
              { status: 400 }
            );
        }

        const newBooking = await BookingService.reserveTicket({
            userId,
            ticketTierId : parseInt(ticketTierId , 10),
            quantity : parseInt(quantity , 10)
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