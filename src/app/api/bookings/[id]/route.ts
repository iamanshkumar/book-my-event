import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request : Request , context : RouteContext){
    try{
        const {id} = await context.params;
        const bookingId = parseInt(id , 10);

        const headerList = await headers();
        const userId = parseInt(headerList.get("x-user-id") || '0', 10);

        if(!userId){
            return NextResponse.json({
                error : "Unauthorised"
            },{
                status : 401
            });
        }

        const booking = await prisma.booking.findUnique({
            where : {id : bookingId},
            include: {
                event: true,
                ticketTier: true,
                user: { select: { name: true, email: true } }
            }
        });

        if(!booking){
            return NextResponse.json({
                error : "Booking record not found."
            },{
                status : 404
            });
        }

        if(booking.userId!==userId && booking.event.organizerId !== userId){
            return NextResponse.json({
                error : "Forbidden."
            },{
                status : 403
            });
        }

        return NextResponse.json({
            booking
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