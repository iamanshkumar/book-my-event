import { EventCategory, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

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
    country? : string;
    pincode? : string;
    dateTime : string;
    duration : string;
    banner? : string;
    thumbnail? : string;
    trailerUrls? : string[];
    category? : EventCategory;
    currency? : string;
    ticketTiers : TicketTierInput[];
    minimumAge : number | null;
    terms? : string;
}
export class EventService {
    static async createEventWithTiers(input : CreateEventInput){
        const organizer = await prisma.user.findUnique({
            where : {id : input.organizerId},
            include: { address: true }
        });

        if(organizer?.role==="ORGANIZER" && !organizer.isVerified){
            throw new Error("Your account must be verified before you can create events.");
        }

        if(organizer?.role==="ORGANIZER" && !organizer.address){
            throw new Error("Your details are incomplete, please complete your details.");
        }
        
        if (input.country && (input.country.length !== 3 || !countries.isValid(input.country))) {
            throw new Error("Invalid country code. Please provide a valid 3-letter ISO code.");
        }

        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const event = await tx.event.create({
                data : {
                    organizerId : input.organizerId,
                    eventName : input.name,
                    description : input.description ?? null,
                    location : input.location,
                    country : input.country ?? "IND",
                    pincode : input.pincode ?? null,
                    dateTime : new Date (input.dateTime),
                    duration : input.duration,
                    banner : input.banner ?? null,
                    thumbnail : input.thumbnail ?? null,
                    trailerUrls : input.trailerUrls ?? undefined,
                    category : input.category ?? undefined,
                    status : "PUBLISHED",
                    currency : input.currency ?? "INR",
                    minimumAge : input.minimumAge !==undefined ? input.minimumAge : null,
                    terms : input.terms ?? null,
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