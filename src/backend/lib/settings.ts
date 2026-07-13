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
    const metaDescription = map["metaDescription"] !== undefined ? map["metaDescription"] : "Find live shows, concerts, workshops, and theater events. Secure your seats and book ticket passes online.";
    const websiteLogo = map["websiteLogo"] !== undefined ? map["websiteLogo"] : null;
    const heroHeading = map["heroHeading"] !== undefined ? map["heroHeading"] : "Unlock Unforgettable Live Experiences";

    // Write default values to DB if they were not set
    if (map["websiteTitle"] === undefined) await upsertSetting(userId, "websiteTitle", websiteTitle);
    if (map["metaTitle"] === undefined) await upsertSetting(userId, "metaTitle", metaTitle);
    if (map["metaDescription"] === undefined) await upsertSetting(userId, "metaDescription", metaDescription);
    if (map["websiteLogo"] === undefined) await upsertSetting(userId, "websiteLogo", websiteLogo || "");
    if (map["heroHeading"] === undefined) await upsertSetting(userId, "heroHeading", heroHeading);

    return {
        id: 0,
        userId,
        websiteTitle,
        metaTitle,
        metaDescription,
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

    const captchaTypeRegister = map["captchaTypeRegister"] !== undefined ? map["captchaTypeRegister"] : "NONE";
    const captchaTypeForgotPassword = map["captchaTypeForgotPassword"] !== undefined ? map["captchaTypeForgotPassword"] : "NONE";
    const captchaV3SiteKey = map["captchaV3SiteKey"] !== undefined ? map["captchaV3SiteKey"] : "";
    const captchaV3SecretKey = map["captchaV3SecretKey"] !== undefined ? map["captchaV3SecretKey"] : "";
    const captchaV2CheckboxSiteKey = map["captchaV2CheckboxSiteKey"] !== undefined ? map["captchaV2CheckboxSiteKey"] : "";
    const captchaV2CheckboxSecretKey = map["captchaV2CheckboxSecretKey"] !== undefined ? map["captchaV2CheckboxSecretKey"] : "";
    const captchaV2InvisibleSiteKey = map["captchaV2InvisibleSiteKey"] !== undefined ? map["captchaV2InvisibleSiteKey"] : "";
    const captchaV2InvisibleSecretKey = map["captchaV2InvisibleSecretKey"] !== undefined ? map["captchaV2InvisibleSecretKey"] : "";

    // Write defaults to DB if not set
    if (map["captchaTypeRegister"] === undefined) await upsertSetting(userId, "captchaTypeRegister", captchaTypeRegister);
    if (map["captchaTypeForgotPassword"] === undefined) await upsertSetting(userId, "captchaTypeForgotPassword", captchaTypeForgotPassword);
    if (map["captchaV3SiteKey"] === undefined) await upsertSetting(userId, "captchaV3SiteKey", captchaV3SiteKey);
    if (map["captchaV3SecretKey"] === undefined) await upsertSetting(userId, "captchaV3SecretKey", captchaV3SecretKey);
    if (map["captchaV2CheckboxSiteKey"] === undefined) await upsertSetting(userId, "captchaV2CheckboxSiteKey", captchaV2CheckboxSiteKey);
    if (map["captchaV2CheckboxSecretKey"] === undefined) await upsertSetting(userId, "captchaV2CheckboxSecretKey", captchaV2CheckboxSecretKey);
    if (map["captchaV2InvisibleSiteKey"] === undefined) await upsertSetting(userId, "captchaV2InvisibleSiteKey", captchaV2InvisibleSiteKey);
    if (map["captchaV2InvisibleSecretKey"] === undefined) await upsertSetting(userId, "captchaV2InvisibleSecretKey", captchaV2InvisibleSecretKey);

    return {
        id: 0,
        userId,
        captchaTypeRegister,
        captchaTypeForgotPassword,
        captchaV3SiteKey,
        captchaV3SecretKey,
        captchaV2CheckboxSiteKey,
        captchaV2CheckboxSecretKey,
        captchaV2InvisibleSiteKey,
        captchaV2InvisibleSecretKey
    };
}

export async function updateGeneralSettings(userId = 0, data: any) {
    await upsertSetting(userId, "websiteTitle", data.websiteTitle || "BookMyEvent");
    await upsertSetting(userId, "metaTitle", data.metaTitle || data.websiteTitle || "BookMyEvent - Discover & Book Live Experiences");
    await upsertSetting(userId, "metaDescription", data.metaDescription || "Find live shows, concerts, workshops, and theater events. Secure your seats and book ticket passes online.");
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
    await upsertSetting(userId, "captchaTypeRegister", data.captchaTypeRegister || "NONE");
    await upsertSetting(userId, "captchaTypeForgotPassword", data.captchaTypeForgotPassword || "NONE");
    await upsertSetting(userId, "captchaV3SiteKey", data.captchaV3SiteKey || "");
    await upsertSetting(userId, "captchaV3SecretKey", data.captchaV3SecretKey || "");
    await upsertSetting(userId, "captchaV2CheckboxSiteKey", data.captchaV2CheckboxSiteKey || "");
    await upsertSetting(userId, "captchaV2CheckboxSecretKey", data.captchaV2CheckboxSecretKey || "");
    await upsertSetting(userId, "captchaV2InvisibleSiteKey", data.captchaV2InvisibleSiteKey || "");
    await upsertSetting(userId, "captchaV2InvisibleSecretKey", data.captchaV2InvisibleSecretKey || "");
    return getCaptchaSettings(userId);
}

export async function getTermsSettings(userId = 0) {
    const map = await getSettingsMap(userId);

    const signupTermsEnabled = map["signupTermsEnabled"] === "true";
    const signupTermsContent = map["signupTermsContent"] !== undefined ? map["signupTermsContent"] : "";

    // Write defaults to DB if not set
    if (map["signupTermsEnabled"] === undefined) await upsertSetting(userId, "signupTermsEnabled", signupTermsEnabled ? "true" : "false");
    if (map["signupTermsContent"] === undefined) await upsertSetting(userId, "signupTermsContent", signupTermsContent);

    return {
        id: 0,
        userId,
        signupTermsEnabled,
        signupTermsContent
    };
}

export async function updateTermsSettings(userId = 0, data: any) {
    await upsertSetting(userId, "signupTermsEnabled", data.signupTermsEnabled ? "true" : "false");
    await upsertSetting(userId, "signupTermsContent", data.signupTermsContent || "");
    return getTermsSettings(userId);
}

export async function getMaintenanceSettings(userId = 0) {
    const map = await getSettingsMap(userId);

    const maintenanceModeEnabled = map["maintenanceModeEnabled"] !== undefined ? map["maintenanceModeEnabled"] : "0";
    const maintenanceContent = map["maintenanceContent"] !== undefined ? map["maintenanceContent"] : "The website is currently undergoing scheduled maintenance. Please check back shortly.";
    const maintenanceAllowedIps = map["maintenanceAllowedIps"] !== undefined ? map["maintenanceAllowedIps"] : "";

    // Write defaults to DB if not set
    if (map["maintenanceModeEnabled"] === undefined) await upsertSetting(userId, "maintenanceModeEnabled", maintenanceModeEnabled);
    if (map["maintenanceContent"] === undefined) await upsertSetting(userId, "maintenanceContent", maintenanceContent);
    if (map["maintenanceAllowedIps"] === undefined) await upsertSetting(userId, "maintenanceAllowedIps", maintenanceAllowedIps);

    return {
        id: 0,
        userId,
        maintenanceModeEnabled,
        maintenanceContent,
        maintenanceAllowedIps
    };
}

export async function updateMaintenanceSettings(userId = 0, data: any) {
    await upsertSetting(userId, "maintenanceModeEnabled", data.maintenanceModeEnabled || "0");
    await upsertSetting(userId, "maintenanceContent", data.maintenanceContent || "");
    await upsertSetting(userId, "maintenanceAllowedIps", data.maintenanceAllowedIps || "");
    return getMaintenanceSettings(userId);
}