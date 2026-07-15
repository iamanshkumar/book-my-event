import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isOrganizer } from "@/backend/lib/role";

export async function GET(){
    try{
        const headerList = await headers();
        const organizerId = parseInt(headerList.get("x-user-id")||'0' , 10);

        if(!isOrganizer(headerList)){
            return NextResponse.json({
                error : 'Access denied. Organizers only.'
            },{
                status : 403
            });
        }

        const organizerBookings = await prisma.booking.findMany({
            where : {
                event : {organizerId}
            },
            include : {
                event: { select: { eventName: true, dateTime: true } },
                ticketTier: { select: { tierName: true } },
                user: { select: { name: true, email: true } }
            },
            orderBy : { createdAt: 'desc' }
        });

        return NextResponse.json(
            {bookings: organizerBookings }, 
            { status: 200 }
        );
    }catch(err : any){
        return NextResponse.json({
            error : err.message
        },{
            status : 500
        });
    }
}