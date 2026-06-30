import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string; tierId: string }> };

export async function PUT(request : Request , context : RouteContext){
    try{
        const {id , tierId} = await context.params;
        const eventId = parseInt(id , 10);
        const targetTierId = parseInt(tierId , 10);

        const headerList = await headers();
        const organizerId = parseInt(headerList.get("x-user-id") || '0' , 10);

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

        if(event.organizerId!==organizerId){
            return NextResponse.json({
                error : "Forbidden."
            },{
                status : 403
            });
        }

        const body = await request.json();
        const { tierName, totalSeats, pricePerSeatExcludingTax, taxPercentage } = body;

        const currentTier = await prisma.ticketTier.findUnique({
            where : {id : targetTierId}
        });

        if(!currentTier){
            return NextResponse.json({
                error : 'Target ticket tier not found.'
            },{
                status : 404
            });
        }

        let updatedAvailableSeats = currentTier.availableSeats;
        if(totalSeats!==undefined){
            const seatCapacityDelta = totalSeats - currentTier.totalSeats;
            updatedAvailableSeats = currentTier.availableSeats + seatCapacityDelta;

            if(updatedAvailableSeats<0){
                return NextResponse.json({
                    error : 'Cannot reduce capacity below currently occupied tickets.'
                },{
                    status : 400
                });
            }
        }

        const updatedTier = await prisma.ticketTier.update({
            where : {id : targetTierId},
            data : {
                tierName,
                totalSeats: totalSeats ? parseInt(totalSeats, 10) : undefined,
                availableSeats: updatedAvailableSeats,
                pricePerSeatExcludingTax: pricePerSeatExcludingTax ? String(pricePerSeatExcludingTax) : undefined,
                taxPercentage: taxPercentage ? String(taxPercentage) : undefined
            }
        });

        return NextResponse.json({
            message : 'Ticket tier modified successfully.'
        },{
            status : 200
        });
    }catch(err : any){
        return NextResponse.json({
            error : err.message
        },{
            status : 500
        });
    }
}