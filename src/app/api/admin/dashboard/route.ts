import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { isAdmin } from "@/backend/lib/role";

export const dynamic = 'force-dynamic';

export async function GET(){
    try{
        const headerList = await headers();
        if(!isAdmin(headerList)){
            return NextResponse.json({
                error : "Forbidden."
            },{
                status : 403
            });
        }

        const [totalUsers , totalEvents , bookingsData] = await prisma.$transaction([
            prisma.user.count(),
            prisma.event.count(),
            prisma.booking.findMany({
                where: { paymentStatus: 'SUCCESS' },
                select: { totalPricePaid: true, quantity: true }
            })
        ]);

        const globalRevenue = bookingsData.reduce((sum: number, b) => sum + Number(b.totalPricePaid), 0);
        const globalTicketsSold = bookingsData.reduce((sum: number, b) => sum + b.quantity, 0);

        return NextResponse.json({
            metrics: {
              globalRevenue,
              globalTicketsSold,
              totalRegisteredUsers: totalUsers,
              totalEventsHosted: totalEvents
            }
        }, { status: 200 });
    }catch(err : any){
        return NextResponse.json({
            error : err.message
        },{
            status : 500
        });
    }
}