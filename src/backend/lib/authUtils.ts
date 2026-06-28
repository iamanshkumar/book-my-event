import {SignJWT , jwtVerify} from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if(!JWT_SECRET){
    throw new Error("JWT_SECRET enivorment variables is missing");
}

const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
    userId: number;
    email: string;
    role: 'CUSTOMER' | 'ORGANIZER' | 'ADMIN';
}

export async function signToken(payload : JWTPayload) : Promise<string>{
    return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedSecret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, encodedSecret);
      return payload as unknown as JWTPayload;
    } catch (error) {
      return null;
    }
}