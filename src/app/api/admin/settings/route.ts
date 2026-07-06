import { prisma } from "@/backend/lib/prisma";
import {
  getCaptchaSettings,
  getGeneralSettings,
  getSmtpSettings,
  updateGeneralSettings,
  updateSmtpSettings,
  updateCaptchaSettings
} from "@/backend/lib/settings";
import { error } from "console";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

async function verifyAdmin(){
    const headerList = await headers();
    const role = headerList.get("x-user-role");
    return role==="ADMIN";
}

export async function GET(){
    if(!(await verifyAdmin())){
        return NextResponse.json({
            error : "Access denied"
        },{
            status : 403
        })
    }

    try{
        const general = await getGeneralSettings();
        const smtp = await getSmtpSettings();
        const captcha = await getCaptchaSettings();

        return NextResponse.json({general , smtp , captcha} , {status : 200});
    }catch(err : any){
        return NextResponse.json({error : err} , {status : 500});
    }
}

export async function PUT(request : Request){
    if(!(await verifyAdmin())){
        return NextResponse.json({
            error : "Access denied",
        },{
            status : 403
        });
    }

    try{
        const body = await request.json();
        const {type , data} = body;

        if(type==="general"){
            const updated = await updateGeneralSettings(0, data);
            return NextResponse.json({message : "General settings updated" , settings : updated} , {status : 200});
        }

        if(type==="smtp"){
            const updated = await updateSmtpSettings(0, data);
            return NextResponse.json({message : "SMTP settings updated" , settings : updated} , {status : 200});
        }

        if(type==="captcha"){
            const updated = await updateCaptchaSettings(0, data);
            return NextResponse.json({message : "Captcha settings updated" , settings : updated} , {status : 200});
        }

        return NextResponse.json({message : "Invalid settings category"} , {status : 400});
    }catch(err : any){
        return NextResponse.json({error : err.message} , {status : 500});
    }
}