import { DashboardService } from "@/backend/services/DashboardService";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isOrganizer } from "@/backend/lib/role";

export async function GET(){
    try{
        const headerList = await headers();
        const organizerIdStr = headerList.get("x-user-id");

        if(!organizerIdStr || !isOrganizer(headerList)){
            return NextResponse.json({
                error : 'Forbidden. Access restricted to valid ORGANIZER profiles.'
            },{
                status : 403
            })
        }

        const organizerId = parseInt(organizerIdStr);

        const metrics = await DashboardService.getOrganizerMetrics(organizerId);

        return NextResponse.json({metrics} , {status : 200});
    }catch(err : any){
        return NextResponse.json({
            error : err.message || 'Failed to process dashboard metrics compilation.'
        },{
            status : 500
        })
        
    }
}