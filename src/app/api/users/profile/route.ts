import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PUT(request : Request){
    try{
        const headerList = await headers();
        const userIdStr = headerList.get("x-user-id");

        if(!userIdStr){
            return NextResponse.json({
                error : "Unauthorised"
            },{
                status : 401
            });
        }

        const userId = parseInt(userIdStr , 10);
        const {name , email} = await request.json();

        if(!name || !email){
            return NextResponse.json({
                error: 'Name and email are required fields.'
            },{
                status : 400
            });
        }

        const existingEmailOwner = await prisma.user.findFirst({
            where : {email, NOT: { id: userId }}
        });

        if (existingEmailOwner) {
            return NextResponse.json({ error: 'Email address is already claimed by another profile.' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { name, email },
            select: { id: true, name: true, email: true, role: true }
        });

        return NextResponse.json({
            message: 'Profile updated successfully!',
            user: updatedUser
        },{
            status : 200
        })
    }catch(err : any){
        return NextResponse.json({
            error : err.message || 'Internal update failure'
        },{
            status : 500
        })
    }
}