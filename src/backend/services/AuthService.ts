import {prisma} from "../lib/prisma";
import bcrypt, { genSalt } from "bcryptjs";

export class AuthService{
    static async registerUser(name : string , email : string , passwordPlain : string , role : 'CUSTOMER' | 'ORGANIZER'){
        const existingUser = await prisma.user.findUnique({
            where : {email}
        })

        if(existingUser){
            throw new Error("An account with this email already exists.");
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(passwordPlain , salt);

        const isOrganizer = role === "ORGANIZER";
        const verificationToken = isOrganizer ? Math.floor(100000 + Math.random() * 900000).toString() : null;
        const verificationTokenExpiry = isOrganizer ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

        const isVerified = !isOrganizer;

        const newUser = await prisma.user.create({
          data: {
            name,
            email,
            passwordHash,
            role,
            isVerified,
            verificationToken,
            verificationTokenExpiry,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isVerified : true,
            verificationToken : true,
            createdAt: true,
          },
        });


        return newUser;
    }

    static async loginUser(email : string , passwordPlain : string){
        const user = await prisma.user.findUnique({
            where : {email}
        });

        if(!user){
            throw new Error("Invalid email or password.");
        }

        const isPasswordValid = await bcrypt.compare(passwordPlain , user.passwordHash);

        if(!isPasswordValid){
            throw new Error("Invalid email or password.");
        }

        return {
            id : user.id,
            name : user.name,
            email : user.email,
            role : user.role,
            createdAt : user.createdAt
        };
    }
}