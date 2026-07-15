import { prisma } from "@/backend/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isAdmin } from "@/backend/lib/role";

export const dynamic = 'force-dynamic';

export async function GET(request : Request){
    try{
        const headerList = await headers();

        if(!isAdmin(headerList)){
            return NextResponse.json({
                error : 'Forbidden. Admin privileges required.'
            },{
                status : 403
            });
        }

        const {searchParams} = new URL(request.url);
        const search = searchParams.get('search');

        const users = await prisma.user.findMany({
            where: search ? {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } }
              ]
            } : {},
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            users
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