import { prisma } from "@/backend/lib/prisma";
import {
  getCaptchaSettings,
  getGeneralSettings,
  getSmtpSettings,
  getTermsSettings,
  getMaintenanceSettings,
  updateGeneralSettings,
  updateSmtpSettings,
  updateCaptchaSettings,
  updateTermsSettings,
  updateMaintenanceSettings
} from "@/backend/lib/settings";
import { error } from "console";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isAdmin } from "@/backend/lib/role";

async function verifyAdmin(){
    const headerList = await headers();
    return isAdmin(headerList);
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
        const terms = await getTermsSettings();
        const maintenance = await getMaintenanceSettings();

        return NextResponse.json({general , smtp , captcha , terms, maintenance} , {status : 200});
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

        if(type==="terms"){
            const updated = await updateTermsSettings(0, data);
            return NextResponse.json({message : "Terms settings updated" , settings : updated} , {status : 200});
        }

        if(type==="maintenance"){
            const updated = await updateMaintenanceSettings(0, data);
            return NextResponse.json({message : "Maintenance settings updated" , settings : updated} , {status : 200});
        }

        return NextResponse.json({message : "Invalid settings category"} , {status : 400});
    }catch(err : any){
        return NextResponse.json({error : err.message} , {status : 500});
    }
}