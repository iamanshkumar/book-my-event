import { prisma } from "@/backend/lib/prisma";
import { getCaptchaSettings, getGeneralSettings, getSmtpSettings } from "@/backend/lib/settings";
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
            const general = await getGeneralSettings();
            const updated = await prisma.generalSetting.update({
                where : {id : general.id},
                data : {
                    websiteTitle : data.websiteTitle,
                    metaTitle : data.metaTitle || data.websiteTitle,
                    websiteLogo : data.websiteLogo,
                    heroHeading : data.heroHeading
                }
            });

            return NextResponse.json({message : "General settings updated" , settings : updated} , {status : 200});
        }

        if(type==="smtp"){
            const smtp = await getSmtpSettings();
            const updated = await prisma.smtpSetting.update({
                where : {id : smtp.id},
                data : {
                    smtpServer : data.smtpServer,
                    smtpPort : parseInt(data.smtpPort, 10) || 587,
                    smtpProtocol : data.smtpProtocol,
                    smtpUser : data.smtpUser || "",
                    smtpPassword : data.smtpPassword || ""
                }
            });

            return NextResponse.json({message : "SMTP settings updated" , settings : updated} , {status : 200});
        }

        if(type==="captcha"){
            const captcha = await getCaptchaSettings();
            const updated = await prisma.captchaSetting.update({
                where : {id : captcha.id},
                data : {
                    captchaEnabledRegister : !!data.captchaEnabledRegister,
                    captchaEnabledForgotPassword : !!data.captchaEnabledForgotPassword,
                    captchaSiteKey : data.captchaSiteKey,
                    captchaSecretKey : data.captchaSecretKey
                }
            });

            return NextResponse.json({message : "Captcha settings updated" , settings : updated} , {status : 200});
        }

        return NextResponse.json({message : "Invalid settings category"} , {status : 400});
    }catch(err : any){
        return NextResponse.json({error : err.message} , {status : 500});
    }
}