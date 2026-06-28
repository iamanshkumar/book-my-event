import { AuthService } from "@/backend/services/AuthService";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signToken } from "@/backend/lib/authUtils";

export async function POST(request : Request){
    try{
        const body = await request.json();
        const {email , password} = body;

        if(!email || !password){
            return NextResponse.json({
                error : "Email and password are required fields."
            },{
                status : 400
            });
        }

        const user = await AuthService.loginUser(email , password);

        const token = await signToken({
            userId : user.id,
            email : user.email,
            role : user.role as 'CUSTOMER' | 'ORGANIZER' | 'ADMIN',
        })

        const cookieStore = await cookies();
        cookieStore.set("session_token" , token , {
            httpOnly : true,
            secure : process.env.NODE_ENV === 'production',
            sameSite : 'lax',
            maxAge : 60 * 60 * 24 * 7,
            path : '/',
        });

        return NextResponse.json({
            message: 'Logged in successfully!', user
        },{
            status : 200
        })
    }catch(err : any){
        return NextResponse.json(
            { error: err.message || 'Authentication failed.' },
            { status: 401 }
          );
    }
}