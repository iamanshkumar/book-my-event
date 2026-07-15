import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import cc from "currency-codes";
import { isOrganiser, isAdmin } from "@/backend/lib/role";

export async function GET(request : Request){
    try{
        const headerList = await headers();
        const userIdStr = headerList.get("x-user-id");

        if(!isOrganiser(headerList) && !isAdmin(headerList)){
            return NextResponse.json({
                error : "Access denied"
            },{
                status : 403
            });
        }

        const userId = parseInt(userIdStr || "",10);
        if(isNaN(userId)){
            return NextResponse.json({
                error : "Invalid response"
            },{
                status : 401
            });
        }

        const user = await prisma.user.findUnique({
            where : {id : userId},
            select : {
                allowedCurrencies : true,
                defaultCurrency : true
            }
        });

        if(!user){
            return NextResponse.json({
                error : "User not found"
            },{
                status : 404
            });
        }

        const allowed = user.allowedCurrencies ? (user.allowedCurrencies as string[]) : ["INR"];
        const def = user.defaultCurrency || "INR";

        return NextResponse.json({
            allowedCurrencies : allowed,
            defaultCurrency : def
        },{
            status : 200
        });
    }catch(err : any){
        return NextResponse.json({
            error : err.message
        },{
            status : 500
        });
    }
}

export async function PUT(request : Request){
    try{
        const headerList = await headers();
        const userIdStr = headerList.get("x-user-id");

        if(!isOrganiser(headerList) && !isAdmin(headerList)){
            return NextResponse.json({
                error : "Access denied"
            },{
                status : 403
            });
        }

        const userId = parseInt(userIdStr || "",10);
        if(isNaN(userId)){
            return NextResponse.json({
                error : "Invalid session"
            },{
                status : 401
            });
        }

        const {allowedCurrencies , defaultCurrency} = await request.json();
        if(!Array.isArray(allowedCurrencies) || allowedCurrencies.length===0){
            return NextResponse.json({
                error : "At least one currency must be selected"
            },{
                status : 400
            });
        }

        if(allowedCurrencies.length>5){
            return NextResponse.json({
                error : "You can choose maximum of 5 currencies"
            },{
                status : 400
            });
        }

        const validCodes = cc.codes();
        const isValidISO = allowedCurrencies.every(curr=>typeof curr === "string" && validCodes.includes(curr.toUpperCase()));

        if(!isValidISO){
            return NextResponse.json({
                error : "Invalid currency code provided"
            },{
                status : 400
            });
        }

        if(!allowedCurrencies.includes(defaultCurrency)){
            return NextResponse.json({
                error : "Default currency must be one of the selected allowed currencies"
            },{
                status : 400
            });
        }

        const uniqueCurrencies = Array.from(new Set(allowedCurrencies));
        if (uniqueCurrencies.length !== allowedCurrencies.length) {
            return NextResponse.json({
                error: "Duplicate currencies are not allowed"
            }
            ,{
                status: 400
            });
        }

        await prisma.user.update({
            where : {id : userId},
            data : {
                allowedCurrencies,
                defaultCurrency
            }
        });

        return NextResponse.json({
            message : "Currency settings updated successfully"
        })
    }catch(err : any){
        return NextResponse.json({
            error : err.message
        },{
            status : 500
        });
    }
}