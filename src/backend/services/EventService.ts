import {prisma} from "../lib/prisma";

interface TicketTierInput{
    name : string;
    totalSeats : number;
    price : number;
    taxPercentage? : number;
}

interface CreateEventInput{
    organizerId : number;
    name : string;
    description? : string;
    location : string;
    dateTime : string;
    duration : string;
    banner? : string;
    thumbnail? : string;
    trailerUrl? : string;
    ticketTiers : TicketTierInput[];
}

export class EventService {
    static async createEventWithTiers(input : CreateEventInput){
        return await prisma.$transaction(async(tx)=>{
            const event = await tx.event.create({
                data : {
                    organizerId : input.organizerId,
                    eventName : input.name,
                    description : input.description ?? null,
                    location : input.location,
                    dateTime : new Date (input.dateTime),
                    duration : input.duration,
                    banner : input.banner ?? null,
                    thumbnail : input.thumbnail ?? null,
                    trailerUrl : input.trailerUrl ?? null,
                    status : "PUBLISHED",
                }
            });

            const tierPromises = input.ticketTiers.map((tier)=>
                tx.ticketTier.create({
                    data : {
                        eventId : event.id,
                        tierName : tier.name,
                        totalSeats : tier.totalSeats,
                        availableSeats : tier.totalSeats,
                        pricePerSeatExcludingTax : tier.price,
                        taxPercentage : tier.taxPercentage || 0
                    }
                })
            );

            const createdTiers = await Promise.all(tierPromises);

            return {
                ...event,
                ticketTiers : createdTiers
            };
        })
    }
}