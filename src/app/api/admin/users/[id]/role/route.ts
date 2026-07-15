import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { isAdmin } from "@/backend/lib/role";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext){
    try{
        const {id} = await context.params;
        const targetUserId = parseInt(id , 10);

        const headersList = await headers();
        if (!isAdmin(headersList)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { role } = await request.json();
        if (!role || !['CUSTOMER', 'ORGANIZER', 'ADMIN'].includes(role)) {
            return NextResponse.json({ error: 'Invalid or missing role definition type.' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: { role },
            select: { id: true, name: true, email: true, role: true }
        });

        return NextResponse.json(
            { message: 'User privilege role modified.', user: updatedUser },
             { status: 200 }
        );
    }catch(err : any){
        return NextResponse.json(
            {
                error : err.message
            },{
                status : 500
            }
        )
    }
}