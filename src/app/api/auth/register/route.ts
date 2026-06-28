import { AuthService } from "@/backend/services/AuthService";
import { NextResponse } from "next/server";

export async function POST(request : Request){
    try{
        const body = await request.json();
        const {name , email , password , role} = body;

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