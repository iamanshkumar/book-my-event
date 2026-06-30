import { prisma } from "@/backend/lib/prisma";
import bcrypt from "bcryptjs";
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
        const {oldPassword , newPassword} = await request.json();

        if(!oldPassword || !newPassword){
            return NextResponse.json({
                error : 'Both old and new password fields are required.'
            },{
                status : 400
            });
        }

        const user = await prisma.user.findUnique({
            where : {id : userId}
        });

        if(!user){
            return NextResponse.json({
                error : "User not found"
            },{
                status : 404
            });
        }

        const isMatch = await bcrypt.compare(oldPassword,user.passwordHash);
        if(!isMatch){
            return NextResponse.json({
                error : "The old password entered is incorrect"
            },{
                status : 400
            });
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword,salt);

        await prisma.user.update({
            where : {id : userId},
            data : {
                passwordHash : newPasswordHash
            }
        });

        return NextResponse.json({
            message: 'Password changed successfully!'
        },{
            status : 200
        })
    }catch(err : any){
        return NextResponse.json({
            error : err.message || 'Internal error.'
        },{
            status : 500
        })
    }
}