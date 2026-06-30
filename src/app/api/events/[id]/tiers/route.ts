import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request : Request , context : RouteContext){
    try{
        const {id} = await context.params;
        const eventId = parseInt(id , 10);

        const headerList = await headers();
        const organizerId = parseInt(headerList.get("x-user-id")||'0',10);

        const event = await prisma.event.findUnique({
            where : {id : eventId}
        });

        if(!event){
            return NextResponse.json({
                error : "Event not found"
            },{
                status : 404
            });
        }

        if(organizerId!==event.organizerId){
            return NextResponse.json({
                error : "Forbidden. Owner mismatched."
            },{
                status : 403
            });
        }

        const body = await request.json();
        const { tierName, totalSeats, pricePerSeatExcludingTax, taxPercentage } = body;

        if(!tierName || !totalSeats || !pricePerSeatExcludingTax || !taxPercentage){
            return NextResponse.json({
                error : "Missing mandatory tier parameters"
            },{
                status : 400
            });
        }

        const newTier = await prisma.ticketTier.create({
            data : {
                eventId,
                tierName,
                totalSeats : parseInt(totalSeats,10),
                availableSeats : parseInt(totalSeats , 10),
                pricePerSeatExcludingTax : parseInt(pricePerSeatExcludingTax , 10),
                taxPercentage : String(taxPercentage || '18')
            }
        });

        return NextResponse.json({
            message: 'Ticket tier appended successfully!',
            tier : newTier
        },{
            status : 201
        });
    }catch(err : any){
        return NextResponse.json({
            error : err.message 
        },{
            status : 500
        });
    }
}