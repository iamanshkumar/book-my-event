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

        const newUser = await prisma.user.create({
            data : {
                name , 
                email , 
                passwordHash , 
                role ,
            },
            select : {
                id : true,
                name : true,
                email : true,
                role : true,
                createdAt : true
            }
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