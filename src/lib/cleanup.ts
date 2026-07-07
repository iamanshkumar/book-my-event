import { NextResponse } from "next/server";
import {prisma} from "../backend/lib/prisma";

export function startCleanupTask(){
    setInterval(
      async () => {
        try {
          const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const deleted = await prisma.user.deleteMany({
            where: {
              role: "ORGANIZER",
              isVerified: false,
              createdAt: { lt: threshold },
            },
          });
        } catch (err: any) {
          return NextResponse.json(
            {
              error: err.message,
            },
            {
              status: 500,
            },
          );
        }
      },
      60 * 60 * 1000,
    );
}