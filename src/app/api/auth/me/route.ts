import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const headerList = await headers();
        const userIdStr = headerList.get("x-user-id");

        if(!userIdStr){
            return NextResponse.json({
                error : "Unauthorised. No active session discovered"
            },{
                status : 411
            });
        }

        const userId = parseInt(userIdStr , 10);
        const user = await prisma.user.findUnique({
            where : {id : userId},
            select : {
                id : true,
                name : true,
                email : true,
                role : true,
                isVerified: true,
                createdAt : true,
                address: {
                    select: {
                        id: true
                    }
                }
            }
        });

        if(!user){
            return NextResponse.json({
                error : "User account not found"
            },{
                status : 404
            })
        }

        return NextResponse.json({
            user
        },{
            status : 200
        })
    }catch(err : any){
        return NextResponse.json({
            error : "Failed to retrieve profile metadata."
        },{
            status : 500
        })
    }
}