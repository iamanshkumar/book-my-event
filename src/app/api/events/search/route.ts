import { prisma } from "@/backend/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request : Request){
    try{
        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name');
        const location = searchParams.get('location');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const category = searchParams.get('category');
        const country = searchParams.get('country');
        const pincode = searchParams.get('pincode');

        const queryConditions: any = {
            status: 'PUBLISHED' 
        };

        if(name) {
            queryConditions.eventName = { contains: name };
        }

        if(location){
            queryConditions.location = { contains: location };
        }

        if(category && category !== 'ALL' && category !== 'all'){
            queryConditions.category = category;
        }

        if(country && country !== 'ALL' && country !== 'all'){
            queryConditions.country = country;
        }

        if(pincode){
            queryConditions.pincode = { contains: pincode };
        }

        if(startDate || endDate){
            queryConditions.dateTime = {};
            if (startDate) queryConditions.dateTime.gte = new Date(startDate);
            if (endDate) queryConditions.dateTime.lte = new Date(endDate);
        }

        const matchedEvents = await prisma.event.findMany({
            where: queryConditions,
            include: { ticketTiers: true },
            orderBy: { dateTime: 'asc' }
        });

        return NextResponse.json({
            events: matchedEvents
        },{
            status : 200
        });
    }catch(err : any){
        return NextResponse.json({
            error: err.message
        },{
            status : 500
        })
    }
}