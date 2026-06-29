import {prisma} from "../lib/prisma";
import crypto from "crypto";

interface CreateBookingInput {
    userId : number;
    ticketTierId : number;
    quantity : number;
}

export class BookingService{
    static async reserveTicket(input : CreateBookingInput){
        return await prisma.$transaction(async (tx)=>{
            const tiers: any[] = await tx.$queryRaw`
                SELECT id, event_id, available_seats, price_per_seat_excluding_tax, tax_percentage 
                FROM ticket_tiers 
                WHERE id = ${input.ticketTierId} 
                FOR UPDATE
            `;

            const selectedTier = tiers[0];

            if(!selectedTier){
                throw new Error('The requested ticket tier does not exist.');
            }

            if(selectedTier.available_seats<input.quantity){
                throw new Error(`Not enough seats available. Only ${selectedTier.available_seats} remaining.`);
            }

            const basePrice = Number(selectedTier.price_per_seat_excluding_tax)*input.quantity;
            const taxAmount = basePrice*(Number(selectedTier.tax_percentage)/100);
            const finalPrice = basePrice+taxAmount;

            await tx.ticketTier.update({
                where : {id : input.ticketTierId},
                data :{
                    availableSeats : {
                        decrement : input.quantity
                    }
                }
            });

            const booking = await tx.booking.create({
                data :{
                    userId : input.userId,
                    eventId: selectedTier.event_id,
                    ticketTierId : input.ticketTierId,
                    quantity : input.quantity,
                    totalPricePaid : finalPrice,
                    paymentStatus : "PENDING"
                },
                include : {
                    event : {
                        select : {
                            eventName : true,
                            location : true
                        }
                    },
                    ticketTier : {
                        select : {
                            tierName : true
                        }
                    }
                }
            });

            return booking;
        })
    }
}