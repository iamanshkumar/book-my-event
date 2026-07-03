import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type RouteContext = {params : Promise<{id : string}>};

export async function GET(request : Request , context : RouteContext){
    try{
        const {id} = await context.params;
        const eventId = parseInt(id,10);

        const event = await prisma.event.findUnique({
            where : {id : eventId},
            include : {
                ticketTiers : true,
                organizer : {
                    select : {
                        id : true,
                        name : true,
                        email : true
                    }
                }
            }
        });


        if(!event){
            return NextResponse.json({
                error : "Event not found"
            },{
                status : 404
            });
        }

        return NextResponse.json({
            event
        },{
            status : 200
        })
    }catch(err : any){
        return NextResponse.json({
            error : err.message
        },{
            status : 500
        })
    }
} 

export async function PUT(request : Request , context : RouteContext){
    try{
        const {id} = await context.params;
    const eventId = parseInt(id , 10);

    const headerList = await headers();
    const organizerId = parseInt(headerList.get("x-user-id") || '0' , 10);

    const existingEvent = await prisma.event.findUnique({
        where : {id : eventId}
    });

    if(!existingEvent){
        return NextResponse.json({
            error : "Event not found"
        },{
            status : 404
        });
    }

    if(existingEvent.organizerId!==organizerId){
        return NextResponse.json({
            error : "Forbidden. You do not own this event."
        },{
            status : 403
        });
    }

    const body = await request.json();
    const { eventName, description, location, dateTime, duration, banner, thumbnail, trailerUrls, ticketTiers } = body;

    const updatedEvent = await prisma.$transaction(async (tx)=>{
        const event = await tx.event.update({
            where : {id : eventId},
            data : {
                eventName,
                description,
                location,
                dateTime : new Date(dateTime),
                duration,
                banner,
                thumbnail,
                trailerUrls : trailerUrls ?? null,
            }
        });

        await tx.ticketTier.deleteMany({where : {eventId}});

        if(ticketTiers && ticketTiers.length>0){
            await tx.ticketTier.createMany({
                data: ticketTiers.map((tier: any) => ({
                  eventId,
                  tierName: tier.tierName,
                  totalSeats: tier.totalSeats,
                  availableSeats: tier.availableSeats ?? tier.totalSeats,
                  pricePerSeatExcludingTax: tier.pricePerSeatExcludingTax,
                  taxPercentage: tier.taxPercentage,
                })),
            });
        }

        return event;
    })

    return NextResponse.json({
        message: 'Event details updated successfully!', event: updatedEvent
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

export async function DELETE(request : Request , context : RouteContext){
    try{
        const {id} = await context.params;
        const eventId = parseInt(id , 10);

        const headerList = await headers();
        const organizerId = parseInt(headerList.get("x-user-id")||'0' , 10);

        const existingEvent = await prisma.event.findUnique({
            where : {id : eventId}
        });

        if(!existingEvent){
            return NextResponse.json({
                error : "Event not found"
            },{
                status : 404
            });
        }

        if(existingEvent.organizerId!==organizerId){
            return NextResponse.json({
                error : "Forbidden. You do not own this event."
            },{
                status : 403
            })
        }

        await prisma.event.delete({
            where : {id : eventId}
        });

        return NextResponse.json({
            message : 'Event successfully dropped from active catalogs.'
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