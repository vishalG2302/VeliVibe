import { NextResponse } from "next/server";
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

export async function GET() {
  try {
    // Ask ImageKit for all files with the tag "tiptok"
    // sort by "DESC_CREATED" so newest show first
    const files = await imagekit.listFiles({
      tags: ["tiptok"], 
      sort: "DESC_CREATED",
      limit: 10 // Fetch top 10 for now
    });
    
    // Return the list to the frontend
    return NextResponse.json(files);
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}