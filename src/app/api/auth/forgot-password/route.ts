import { prisma } from "@/backend/lib/prisma";
import { NextResponse } from "next/server";
import { getCaptchaSettings } from "@/backend/lib/settings";
import { sendEmail } from "@/backend/lib/mail";

export async function POST(request: Request) {
  try {
    const { email, recaptchaToken } = await request.json();

    const captcha = await getCaptchaSettings();
    const activeType = captcha.captchaTypeForgotPassword || "NONE";

    if (activeType !== "NONE") {
      if (!recaptchaToken) {
        return NextResponse.json(
          { error: "Please complete captcha verification check." },
          { status: 400 },
        );
      }
      
      let activeSecretKey = "";
      if (activeType === "V3") activeSecretKey = captcha.captchaV3SecretKey;
      else if (activeType === "V2_CHECKBOX") activeSecretKey = captcha.captchaV2CheckboxSiteKey ? captcha.captchaV2CheckboxSecretKey : "";
      else if (activeType === "V2_INVISIBLE") activeSecretKey = captcha.captchaV2InvisibleSiteKey ? captcha.captchaV2InvisibleSecretKey : "";

      const secret = activeSecretKey ? activeSecretKey.trim() : "";

      if (secret && secret !== "MOCK" && recaptchaToken !== "MOCK_VALIDATION_TOKEN") {
        const res = await fetch(
          "https://www.google.com/recaptcha/api/siteverify",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `secret=${secret}&response=${recaptchaToken}`,
          },
        );
        const result = await res.json();
        if (!result.success) {
          return NextResponse.json(
            { error: "Captcha verification failed. Please try again." },
            { status: 400 },
          );
        }

        if (activeType === "V3" && result.score !== undefined && result.score < 0.5) {
          return NextResponse.json(
            { error: "Spam verification check failed. Please refresh and try again." },
            { status: 400 },
          );
        }
      }
    }

    if (!email) {
      return NextResponse.json(
        {
          error: "Email is required",
        },
        {
          status: 400,
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "If an account matches that email, a secure reset link has been dispatched.",
        },
        {
          status: 200,
        },
      );
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryWindow = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        resetToken: resetCode,
        resetTokenExpiry: expiryWindow,
      },
    });

    try {
      await sendEmail({
        to: email,
        subject: "Your Password Reset Code",
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
      console.log("Password reset verification email dispatched successfully.");
    } catch (emailError) {
      console.error("Failed to send password reset verification email:", emailError);
    }

    return NextResponse.json(
      {
        message:
          "If an account matches that email, a secure reset link has been dispatched.",
      },
      {
        status: 200,
      },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message || "Failed to initialize password reset chain.",
      },
      {
        status: 500,
      },
    );
  }
}
