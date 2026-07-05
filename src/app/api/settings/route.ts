import { getCaptchaSettings, getGeneralSettings } from "@/backend/lib/settings";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const general = await getGeneralSettings();
        const captcha = await getCaptchaSettings();

        return NextResponse.json({
            websiteTitle : general.websiteTitle,
            metaTitle : general.metaTitle,
            websiteLogo : general.websiteLogo,
            heroHeading : general.heroHeading,
            captchaEnabledRegister : captcha.captchaEnabledRegister,
            captchaEnabledForgotPassword : captcha.captchaEnabledForgotPassword,
            captchaSiteKey : captcha.captchaSiteKey
        });
    }catch(err : any){
        return NextResponse.json({
            error : err.message
        },{
            status : 500
        })
    }
}