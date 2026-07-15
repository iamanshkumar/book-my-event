import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { isAdmin } from "@/backend/lib/role";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request : Request , context : RouteContext){
    try{
        const {id} = await context.params;
        const targetEventId = parseInt(id , 10);

        const headersList = await headers();
        if (!isAdmin(headersList)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const event = await prisma.event.findUnique({
            where : {id : targetEventId}
        });

        if(!event){
            return NextResponse.json({
                error : "Event doesn't exists"
            },{
                status : 404
            });
        }
        
        await prisma.event.delete({
            where: { id: targetEventId }
        });

        return NextResponse.json({
            message : 'Administrative force-removal completed successfully.'
        },{
            status : 200
        });
    }catch(err : any){
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}