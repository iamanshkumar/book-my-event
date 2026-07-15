import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isOrganizer } from "@/backend/lib/role";

export async function GET(){
    try{
        const headerList = await headers();
        const organizerIdStr = headerList.get("x-user-id");

        if(!organizerIdStr || !isOrganizer(headerList)){
            return NextResponse.json({
                error : 'Access restricted to organizers.'
            },{
                status : 403
            })
        }

        const organizerId = parseInt(organizerIdStr,10);
        const managedEvents = await prisma.event.findMany({
            where: { organizerId },
            include: { ticketTiers: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            events : managedEvents
        },{
            status : 200
        })
    }catch(err : any){
        return NextResponse.json({
            error: err.message
        },{
            status : 500
        });
    }
}