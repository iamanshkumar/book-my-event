import { AuthService } from "@/backend/services/AuthService";
import { NextResponse } from "next/server";
import { getCaptchaSettings, getTermsSettings } from "@/backend/lib/settings";
import { sendEmail } from "@/backend/lib/mail";

export async function POST(request : Request){
    try{
        const body = await request.json();
        const { name, email, password, role, recaptchaToken, acceptTerms } = body;

        const terms = await getTermsSettings();
        if (terms.signupTermsEnabled && !acceptTerms) {
            return NextResponse.json({ error: "You must accept the terms and conditions to register." }, { status: 400 });
        }

        const captcha = await getCaptchaSettings();

        if (captcha.captchaEnabledRegister) {
            if (!recaptchaToken) {
              return NextResponse.json({ error: "Please complete captcha verification check." }, { status: 400 });
            }
            // Verify token
            if (captcha.captchaSecretKey && captcha.captchaSecretKey !== "MOCK") {
              const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `secret=${captcha.captchaSecretKey}&response=${recaptchaToken}`,
              });
              const result = await res.json();
              if (!result.success) {
                return NextResponse.json({ error: "Captcha verification failed. Please try again." }, { status: 400 });
              }
            }
        }

        if(!name || !email || !password){
            return NextResponse.json({
                error : "Missing details"
            },{
                status : 400
            });
        }

        if(role && role!=="CUSTOMER" && role!=="ORGANIZER"){
            return NextResponse.json({
                error : "Invalid registeration role selected."
            },{
                status : 400
            });
        }

        const user = await AuthService.registerUser(name , email , password , role ||"CUSTOMER");

        if (role === "ORGANIZER" && (user as any).verificationToken) {
          const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/verify-email?code=${(user as any).verificationToken}`;

          try {
            await sendEmail({
              to: email,
              subject: "Verify Your Organizer Account",
              html: `
                        <div style="font-family: sans-serif; padding: 25px; color: #333; max-width: 500px; border: 1px solid #eee; border-radius: 8px;">
                            <h2 style="color: #4f46e5;">Welcome to BookMyEvent!</h2>
                            <p>Please verify your organizer account to begin hosting and scheduling event listings.</p>
                            <div style="margin: 30px 0; text-align: center;">
                                <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; background-color: #f3f4f6; padding: 12px 24px; border-radius: 6px; color: #111827; display: inline-block;">
                                    ${(user as any).verificationToken}
                                </span>
                            </div>
                            <div style="margin: 20px 0; text-align: center;">
                                <a href="${verificationUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                    Click here to verify automatically
                                </a>
                            </div>
                            <p style="font-size: 13px; color: #666; margin-top: 20px;">This code and link will expire in 24 hours. Unverified profiles are automatically removed after 24 hours.</p>
                        </div>
                    `,
            });
            console.log("Organizer verification email sent successfully.");
          } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
          }
        }
        return NextResponse.json(
          {
            message:
              role === "ORGANIZER"
                ? "Account created successfully! Please check your email to verify your profile."
                : "User registered successfully",
            user,
          },
          { status: 201 },
        );
        
    }catch(err : any){
        return NextResponse.json(
            {
                error : err.message || "Somthing went wrong inside the server."
            },
            {status : 500}
        )
    }
}