import { getCaptchaSettings, getGeneralSettings, getTermsSettings } from "@/backend/lib/settings";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const general = await getGeneralSettings();
        const captcha = await getCaptchaSettings();
        const terms = await getTermsSettings();

        return NextResponse.json({
            websiteTitle : general.websiteTitle,
            metaTitle : general.metaTitle,
            metaDescription : general.metaDescription,
            websiteLogo : general.websiteLogo,
            heroHeading : general.heroHeading,
            captchaEnabledRegister : captcha.captchaEnabledRegister,
            captchaEnabledForgotPassword : captcha.captchaEnabledForgotPassword,
            captchaSiteKey : captcha.captchaSiteKey,
            signupTermsEnabled : terms.signupTermsEnabled,
            signupTermsContent : terms.signupTermsContent
        });
    }catch(err : any){
        return NextResponse.json({
            error : err.message
        },{
            status : 500
        })
    }
}