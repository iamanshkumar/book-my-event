import { EventService } from "@/backend/services/EventService";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request : Request){
    try{
        const headerList = await headers();
        const organizerIdStr = headerList.get("x-user-id");
        const userRole = headerList.get("x-user-role");

        if(!organizerIdStr || userRole!=="ORGANIZER"){
            return NextResponse.json({
                error: 'Forbidden. Only users with the ORGANIZER role can create events.' ,
            },{
                status : 403
            })
        }

        const organizerId = parseInt(organizerIdStr , 10);
        const body = await request.json();

        const {name , location , country, pincode, dateTime , duration , ticketTiers , description , banner , thumbnail, trailerUrls, category, currency , minimumAge, terms} = body;

        if(!name || !location || !dateTime || !duration || !ticketTiers || !ticketTiers.length){
            return NextResponse.json({
                error : 'Missing mandatory event parameters or ticket configurations.'
            } , {
                status : 400
            });
        }

        const newEvent = await EventService.createEventWithTiers({
            organizerId,
            name,
            description,
            location,
            country,
            pincode,
            dateTime,
            duration,
            banner,
            thumbnail,
            trailerUrls,
            category,
            currency,
            ticketTiers,
            minimumAge : (minimumAge !== undefined && minimumAge !== null && minimumAge !== "") ? parseInt(String(minimumAge), 10) : null,
            terms: terms || null
        });

        return NextResponse.json({
            message : 'Event and ticket tiers compiled successfully!', event: newEvent
        } , {
            status : 201
        });
    }catch(err : any){
        return NextResponse.json({
            error : err.message || 'Transactional creation execution failed.'
        },{
            status : 500
        })
    }
}