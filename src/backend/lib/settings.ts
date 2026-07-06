import { prisma } from "./prisma"

async function getSettingsMap(userId = 0) {
    const settings = await prisma.setting.findMany({
        where: { userId }
    });
    const map: Record<string, string> = {};
    for (const s of settings) {
        map[s.settingsName] = s.settingsValue;
    }
    return map;
}

export async function upsertSetting(userId = 0, name: string, value: string) {
    await prisma.setting.upsert({
        where: {
            userId_settingsName: {
                userId,
                settingsName: name
            }
        },
        update: {
            settingsValue: value
        },
        create: {
            userId,
            settingsName: name,
            settingsValue: value
        }
    });
}

export async function getGeneralSettings(userId = 0) {
    const map = await getSettingsMap(userId);

    const websiteTitle = map["websiteTitle"] !== undefined ? map["websiteTitle"] : "BookMyEvent";
    const metaTitle = map["metaTitle"] !== undefined ? map["metaTitle"] : "BookMyEvent - Discover & Book Live Experiences";
    const websiteLogo = map["websiteLogo"] !== undefined ? map["websiteLogo"] : null;
    const heroHeading = map["heroHeading"] !== undefined ? map["heroHeading"] : "Unlock Unforgettable Live Experiences";

    // Write default values to DB if they were not set
    if (map["websiteTitle"] === undefined) await upsertSetting(userId, "websiteTitle", websiteTitle);
    if (map["metaTitle"] === undefined) await upsertSetting(userId, "metaTitle", metaTitle);
    if (map["websiteLogo"] === undefined) await upsertSetting(userId, "websiteLogo", websiteLogo || "");
    if (map["heroHeading"] === undefined) await upsertSetting(userId, "heroHeading", heroHeading);

    return {
        id: 0,
        userId,
        websiteTitle,
        metaTitle,
        websiteLogo: websiteLogo || null,
        heroHeading
    };
}

export async function getSmtpSettings(userId = 0) {
    const map = await getSettingsMap(userId);

    const smtpServer = map["smtpServer"] !== undefined ? map["smtpServer"] : "localhost";
    const smtpPort = map["smtpPort"] !== undefined ? parseInt(map["smtpPort"], 10) : 587;
    const smtpProtocol = map["smtpProtocol"] !== undefined ? map["smtpProtocol"] : "TLS";
    const smtpUser = map["smtpUser"] !== undefined ? map["smtpUser"] : "";
    const smtpPassword = map["smtpPassword"] !== undefined ? map["smtpPassword"] : "";

    // Write defaults to DB if not set
    if (map["smtpServer"] === undefined) await upsertSetting(userId, "smtpServer", smtpServer);
    if (map["smtpPort"] === undefined) await upsertSetting(userId, "smtpPort", smtpPort.toString());
    if (map["smtpProtocol"] === undefined) await upsertSetting(userId, "smtpProtocol", smtpProtocol);
    if (map["smtpUser"] === undefined) await upsertSetting(userId, "smtpUser", smtpUser);
    if (map["smtpPassword"] === undefined) await upsertSetting(userId, "smtpPassword", smtpPassword);

    return {
        id: 0,
        userId,
        smtpServer,
        smtpPort,
        smtpProtocol,
        smtpUser,
        smtpPassword
    };
}

export async function getCaptchaSettings(userId = 0) {
    const map = await getSettingsMap(userId);

    const captchaEnabledRegister = map["captchaEnabledRegister"] === "true";
    const captchaEnabledForgotPassword = map["captchaEnabledForgotPassword"] === "true";
    const captchaSiteKey = map["captchaSiteKey"] !== undefined ? map["captchaSiteKey"] : "";
    const captchaSecretKey = map["captchaSecretKey"] !== undefined ? map["captchaSecretKey"] : "";

    // Write defaults to DB if not set
    if (map["captchaEnabledRegister"] === undefined) await upsertSetting(userId, "captchaEnabledRegister", captchaEnabledRegister ? "true" : "false");
    if (map["captchaEnabledForgotPassword"] === undefined) await upsertSetting(userId, "captchaEnabledForgotPassword", captchaEnabledForgotPassword ? "true" : "false");
    if (map["captchaSiteKey"] === undefined) await upsertSetting(userId, "captchaSiteKey", captchaSiteKey);
    if (map["captchaSecretKey"] === undefined) await upsertSetting(userId, "captchaSecretKey", captchaSecretKey);

    return {
        id: 0,
        userId,
        captchaEnabledRegister,
        captchaEnabledForgotPassword,
        captchaSiteKey,
        captchaSecretKey
    };
}

export async function updateGeneralSettings(userId = 0, data: any) {
    await upsertSetting(userId, "websiteTitle", data.websiteTitle || "BookMyEvent");
    await upsertSetting(userId, "metaTitle", data.metaTitle || data.websiteTitle || "BookMyEvent - Discover & Book Live Experiences");
    await upsertSetting(userId, "websiteLogo", data.websiteLogo || "");
    await upsertSetting(userId, "heroHeading", data.heroHeading || "Unlock Unforgettable Live Experiences");
    return getGeneralSettings(userId);
}

export async function updateSmtpSettings(userId = 0, data: any) {
    await upsertSetting(userId, "smtpServer", data.smtpServer || "localhost");
    await upsertSetting(userId, "smtpPort", (data.smtpPort || 587).toString());
    await upsertSetting(userId, "smtpProtocol", data.smtpProtocol || "TLS");
    await upsertSetting(userId, "smtpUser", data.smtpUser || "");
    await upsertSetting(userId, "smtpPassword", data.smtpPassword || "");
    return getSmtpSettings(userId);
}

export async function updateCaptchaSettings(userId = 0, data: any) {
    await upsertSetting(userId, "captchaEnabledRegister", data.captchaEnabledRegister ? "true" : "false");
    await upsertSetting(userId, "captchaEnabledForgotPassword", data.captchaEnabledForgotPassword ? "true" : "false");
    await upsertSetting(userId, "captchaSiteKey", data.captchaSiteKey || "");
    await upsertSetting(userId, "captchaSecretKey", data.captchaSecretKey || "");
    return getCaptchaSettings(userId);
}