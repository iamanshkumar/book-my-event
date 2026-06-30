import { prisma } from "@/backend/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function PUT(request : Request){
    try{
        const {email , code , newPassword} = await request.json();

        if(!email || !code || !newPassword){
            return NextResponse.json({
                error : 'Email , code and newPassword are required.'
            },{
                status : 400
            });
        }

        const user = await prisma.user.findFirst({
            where : {
                email : email,
                resetToken : code,
                resetTokenExpiry : {
                    gte : new Date()
                }
            }
        });

        if(!user){
            return NextResponse.json({
                error : "The password token is either invalid or has expired"
            },{
                status : 400
            })
        }

        const salt = await bcrypt.genSalt(10);
        const updatedPasswordHash = await bcrypt.hash(newPassword , salt);

        await prisma.user.update({
            where : {id : user.id},
            data : {
                passwordHash : updatedPasswordHash,
                resetToken : null,
                resetTokenExpiry : null
            }
        });

        return NextResponse.json({
            message : 'Password has been updated successfully! Proceed to login.'
        },{
            status : 200
        })
    }catch(err : any){
        return NextResponse.json({
            error : err.message || 'Failed to complete password override execution.'
        },{
            status : 500
        })
    }
}