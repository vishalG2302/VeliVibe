import { NextResponse } from "next/server";
import ImageKit from "imagekit";

// Initialize ImageKit on the server side
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!, // Loaded from .env.local
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,         // Loaded from .env.local
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

export async function GET() {
  try {
    // Generate the signature
    const authenticationParameters = imagekit.getAuthenticationParameters();
    return NextResponse.json(authenticationParameters);
  } catch (error) {
    return NextResponse.json({ error: "Auth Failed" }, { status: 500 });
  }
}