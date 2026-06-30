import { prisma } from "../lib/prisma";

interface SettlePaymentInput{
    bookingId : number;
    status : "SUCCESS" | "FAILED";
}

export class PaymentService{
    static async settleBooking(input : SettlePaymentInput){
        return await prisma.$transaction(async (tx)=>{
            const booking = await tx.booking.findUnique({
                where : {id : input.bookingId},
                include : {
                    ticketTier : true
                }
            })

            if(!booking){
                throw new Error('Target booking record not found.');
            }

            if(booking.paymentStatus!=="PENDING"){
                throw new Error(`Booking has already been settled as ${booking.paymentStatus}`);
            }

            if(input.status==="SUCCESS"){
                return await tx.booking.update({
                    where: { id: input.bookingId },
                    data: { paymentStatus: 'SUCCESS' }
                });
            }

            if (input.status === 'FAILED'){
                await tx.ticketTier.update({
                  where: { id: booking.ticketTierId },
                  data: {
                    availableSeats: {
                      increment: booking.quantity 
                    }
                  }
                });
        
                return await tx.booking.update({
                  where: { id: input.bookingId },
                  data: { paymentStatus: 'FAILED' }
                });
            }
        })
    }
}