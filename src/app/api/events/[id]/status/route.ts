import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request : Request , context : RouteContext){
    try{
        const {id} = await context.params;
        const eventId = parseInt(id , 10);

        const headerList = await headers();
        const organizerId = parseInt(headerList.get("x-user-id") || '0',10);

        const {status} = await request.json();
        if(!status){
            return NextResponse.json({
                error: 'Status parameter required'
            },{
                status : 400
            });
        }

        const event = await prisma.event.findUnique({
            where : {id : eventId}
        });

        if(!event){
            return NextResponse.json({
                error: 'Event not found'
            },{
                status : 404
            });
        }

        if(event.organizerId!==organizerId){
            return NextResponse.json({
                error: 'Forbidden'
            },{
                status : 403
            });
        }

        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: { status }
        });

        return NextResponse.json({
            message : `Event status modified to ${status}`,
            event : updatedEvent
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