import {prisma} from "./prisma"

export async function getGeneralSettings(userId = 0){
    let settings = await prisma.generalSetting.findFirst({where : {userId}});
    if(!settings){
        settings = await prisma.generalSetting.create({
            data : {
                userId,
                websiteTitle : "BookMyEvent",
                metaTitle : "BookMyEvent - Discover & Book Live Experiences",
                websiteLogo : null,
                heroHeading : "Unlock Unforgettable Live Experiences"
            }
        })
    }

    return settings
}

export async function getSmtpSettings(userId = 0){
    let settings = await prisma.smtpSetting.findFirst({where : {userId}});
    if(!settings){
        settings = await prisma.smtpSetting.create({
            data : {
                userId,
                smtpServer : "localhost",
                smtpPort : 587,
                smtpProtocol : "TLS",
                smtpUser : "",
                smtpPassword : ""
            }
        })
    }

    return settings;
}

export async function getCaptchaSettings(userId = 0){
    let settings = await prisma.captchaSetting.findFirst({where : {userId}});
    if(!settings){
        settings = await prisma.captchaSetting.create({
            data : {
                userId,
                captchaEnabledRegister : false,
                captchaEnabledForgotPassword : false,
                captchaSiteKey : "",
                captchaSecretKey : "",
            }
        })
    }

    return settings;
}