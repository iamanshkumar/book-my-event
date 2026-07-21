import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request : Request , context : RouteContext){
    try{
        const {id} = await context.params;
        const bookingId = parseInt(id, 10);

        const headerList = await headers();
        const userId = parseInt(headerList.get("x-user-id")||'0' , 10);

        if(!userId){
            return NextResponse.json({
                error : "Unauthorised"
            },{
                status : 403
            });
        }

        const cancelledBooking = await prisma.$transaction(async(tx)=>{
            const booking = await tx.booking.findUnique({
                where : {id : bookingId},
                include : {event : true}
            });

            if(!booking){
                throw new Error('Booking target profile non-existent.');
            }

            if(booking.userId!==userId){
                throw new Error('Forbidden. You do not own this reservation.');
            }

            if(booking.paymentStatus==="REFUNDED"){
                throw new Error('Booking has already been cancelled.');
            }

            await tx.ticketTier.update({
                where : { id: booking.ticketTierId },
                data: {
                    availableSeats: { increment: booking.quantity }
                }
            });

            await tx.couponUsage.deleteMany({
                where: {
                    userId,
                    productId: booking.eventId,
                }
            });

            return await tx.booking.update({
                where: { id: bookingId },
                data: { paymentStatus : 'REFUNDED' } 
              });
        });

        return NextResponse.json({
            message : 'Reservation cancelled successfully. Seat inventory returned.', booking: cancelledBooking
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