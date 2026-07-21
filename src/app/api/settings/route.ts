import { getCaptchaSettings, getGeneralSettings, getTermsSettings } from "@/backend/lib/settings";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(){
    try{
        const general = await getGeneralSettings();
        const captcha = await getCaptchaSettings();
        const terms = await getTermsSettings();

        let captchaSiteKeyRegister = "";
        if (captcha.captchaTypeRegister === "V3") captchaSiteKeyRegister = captcha.captchaV3SiteKey;
        else if (captcha.captchaTypeRegister === "V2_CHECKBOX") captchaSiteKeyRegister = captcha.captchaV2CheckboxSiteKey;
        else if (captcha.captchaTypeRegister === "V2_INVISIBLE") captchaSiteKeyRegister = captcha.captchaV2InvisibleSiteKey;

        let captchaSiteKeyForgotPassword = "";
        if (captcha.captchaTypeForgotPassword === "V3") captchaSiteKeyForgotPassword = captcha.captchaV3SiteKey;
        else if (captcha.captchaTypeForgotPassword === "V2_CHECKBOX") captchaSiteKeyForgotPassword = captcha.captchaV2CheckboxSiteKey;
        else if (captcha.captchaTypeForgotPassword === "V2_INVISIBLE") captchaSiteKeyForgotPassword = captcha.captchaV2InvisibleSiteKey;

        return NextResponse.json({
            websiteTitle : general.websiteTitle,
            metaTitle : general.metaTitle,
            metaDescription : general.metaDescription,
            websiteLogo : general.websiteLogo,
            heroHeading : general.heroHeading,
            isDemoMode : general.isDemoMode,
            captchaTypeRegister : captcha.captchaTypeRegister,
            captchaTypeForgotPassword : captcha.captchaTypeForgotPassword,
            captchaSiteKeyRegister,
            captchaSiteKeyForgotPassword,
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