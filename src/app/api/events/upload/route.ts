import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File | null;
    const type = data.get("type") as string | null;

    if (!file || !type) {
      return NextResponse.json({ error: "Invalid upload parameters" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDirName = type === "banner" ? "banners" : "thumbnails";
    const uploadPath = path.join(process.cwd(), "public", "uploads", uploadDirName);

    // Make sure folder path exists
    await fs.mkdir(uploadPath, { recursive: true });

    // Clean name, prefix date
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadPath, filename);

    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uploadDirName}/${filename}`;

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process upload." }, { status: 500 });
  }
}
