import { prisma } from "@/backend/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request : Request){
    try{
        const {searchParams} = new URL(request.url);
        const code = searchParams.get("code");

        if(!code){
            return NextResponse.json({
                error : "Verification code is missing"
            },{
                status : 400
            });
        }

        const user = await prisma.user.findFirst({
            where : {
                verificationToken : code,
                verificationTokenExpiry: { gt: new Date() }
            }
        });

        if(!user){
            return NextResponse.json({
                error : "Invalid or expired verification code. Unverified accounts are automatically deleted after 24 hours." 
            },{
                status : 400
            });
        }

        await prisma.user.update({
            where : {id : user.id},
            data : {
                isVerified : true,
                verificationToken : null,
                verificationTokenExpiry : null
            }
        });

        return NextResponse.json({
            message : "Organizer account verified successfully"
        },{
            status : 200
        })
    }catch(err : any){
        return NextResponse.json({
            error : err.message
        },{
            status : 500
        });
    }
}