import { prisma } from "@/backend/lib/prisma";
import { NextResponse } from "next/server";
import {Resend} from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request : Request){
    try{
        const {email} = await request.json();

        if(!email){
            return NextResponse.json({
                error : "Email is required"
            } , {
                status : 400
            });
        }

        const user = await prisma.user.findUnique({
            where : {email}
        });

        if(!user){
            return NextResponse.json({
                error : "If an account matches that email, a secure reset link has been dispatched."
            },{
                status : 200
            })
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryWindow = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.user.update({
            where : {email},
            data : {
                resetToken : resetCode,
                resetTokenExpiry : expiryWindow
            }
        });

        await resend.emails.send({
            from: 'BookMyEvent <onboarding@resend.dev>',
            to: email,
            subject: 'Your Password Reset Code',
            html: `
              <div style="font-family: sans-serif; padding: 25px; color: #333; max-width: 500px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #10b981;">Password Reset Code</h2>
                <p>Use the 6-digit verification code below to securely reset your password. Do not share this code with anyone.</p>
                <div style="margin: 30px 0; text-align: center;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background-color: #f3f4f6; padding: 12px 24px; border-radius: 6px; color: #111827;">
                    ${resetCode}
                  </span>
                </div>
                <p style="font-size: 13px; color: #666;">This verification code is single-use only and expires in 15 minutes.</p>
              </div>
            `,
          });

        return NextResponse.json({
            message : 'If an account matches that email, a secure reset link has been dispatched.'
        },{
            status : 200
        })
    }catch(err : any){
        return NextResponse.json({
            error : err.message || 'Failed to initialize password reset chain.'
        },{
            status : 500
        })
    }
}