import { PaymentService } from "@/backend/services/PaymentService";
import { NextResponse } from "next/server";

export async function POST(request : Request){
    try{
        const body = await request.json();

        const {bookingId , paymentStatus} = body;

        if (!bookingId || !paymentStatus || !['SUCCESS', 'FAILED'].includes(paymentStatus)) {
            return NextResponse.json(
              { error: 'Invalid payload parameters. bookingId and valid paymentStatus are required.' },
              { status: 400 }
            );
        }

        const updatedBooking = await PaymentService.settleBooking({
            bookingId: parseInt(bookingId, 10),
            status: paymentStatus
        });

        return NextResponse.json(
            { message: `Booking status updated to ${paymentStatus} cleanly!`, booking: updatedBooking },
            { status: 200 }
        );
    }catch(err : any){
        return NextResponse.json(
            { error: err.message || 'Payment settlement processing execution failed.' },
            { status: 400 }
        );
    }
}