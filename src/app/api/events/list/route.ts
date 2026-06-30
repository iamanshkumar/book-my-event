import { prisma } from "@/backend/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const currentDateTime = new Date();

        const events = await prisma.event.findMany({
            where : {
                status : "PUBLISHED",
                dateTime : {
                    gte : currentDateTime
                },
            },
            include : {
                ticketTiers : {
                    select : {
                        id : true,
                        tierName : true,
                        availableSeats : true,
                        pricePerSeatExcludingTax  : true,
                        taxPercentage : true
                    }
                },
                organizer : {
                    select : {
                        name : true
                    }
                }
            },
            orderBy :{
                dateTime : 'asc'
            }
        })

        return NextResponse.json({
            events
        },{
            status : 200
        })
    }catch(err : any){
        return NextResponse.json(
            { error: err.message || 'Failed to retrieve events.' },
            { status: 500 }
        );
    }
}