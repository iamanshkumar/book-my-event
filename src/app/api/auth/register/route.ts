import { AuthService } from "@/backend/services/AuthService";
import { NextResponse } from "next/server";
import { getCaptchaSettings } from "@/backend/lib/settings";

export async function POST(request : Request){
    try{
        const body = await request.json();
        const { name, email, password, role, recaptchaToken } = body;

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

        return NextResponse.json({
            message : "User registered successfully" , 
            user
        } , {
            status : 201
        });
        
    }catch(err : any){
        return NextResponse.json(
            {
                error : err.message || "Somthing went wrong inside the server."
            },
            {status : 500}
        )
    }
}