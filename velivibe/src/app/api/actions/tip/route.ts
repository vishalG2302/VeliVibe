import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import { NextResponse } from "next/server";

// YOUR TREASURY WALLET
const PLATFORM_WALLET = new PublicKey("VqEffEbCeg1RvfdSudhHj7pHKZzBwszMh1csZ6x5qLz");

// 1. GET Request (Metadata for the Card)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const creator = searchParams.get("creator");
  const videoId = searchParams.get("videoId");
  const ref = searchParams.get("ref");

  if (!creator) {
    return NextResponse.json({ error: "Missing creator" }, { status: 400 });
  }

  const baseHref = `/api/actions/tip?creator=${creator}&videoId=${videoId}`;
  const fullHref = ref ? `${baseHref}&ref=${ref}` : baseHref;

  const payload = {
    // icon: "https://i.imgur.com/qO55V6g.png", // Replace with your App Logo or Video Thumbnail
    title: `Unlock Video #${videoId} on TipTok`,
    description: `Support @${creator.slice(0,6)}... and watch this premium content. Price: 0.0001 SOL.`,
    label: "Unlock for 0.0001 SOL",
    links: {
      actions: [
        {
          label: "Unlock Now (0.0001 SOL)",
          href: fullHref, // The POST endpoint to hit
        }
      ],
    },
  };

  return NextResponse.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
}

// 2. OPTIONS Request (CORS is required for Blinks)
export async function OPTIONS(request: Request) {
  return new Response(null, { headers: ACTIONS_CORS_HEADERS });
}

// 3. POST Request (Build the Transaction)
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creator = searchParams.get("creator");
    const ref = searchParams.get("ref");
    
    const body = await request.json();
    const account = body.account; // The User's Public Key (from Phantom/Twitter)

    if (!account || !creator) {
        return NextResponse.json({ error: "Missing account or creator" }, { status: 400, headers: ACTIONS_CORS_HEADERS });
    }

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const sender = new PublicKey(account);
    const creatorKey = new PublicKey(creator);

    const tx = new Transaction();
    const totalLamports = 0.0001 * LAMPORTS_PER_SOL;

    // --- REUSE YOUR SPLIT LOGIC ---
    let validReferrer = null;
    if (ref && ref !== account && ref !== creator) {
        try { new PublicKey(ref); validReferrer = new PublicKey(ref); } catch (e) {}
    }

    if (validReferrer) {
        // 3-WAY SPLIT
        const platformFee = Math.floor(totalLamports * 0.10);
        const referralFee = Math.floor(totalLamports * 0.45);
        const creatorFee = totalLamports - platformFee - referralFee;

        tx.add(SystemProgram.transfer({ fromPubkey: sender, toPubkey: PLATFORM_WALLET, lamports: platformFee }));
        tx.add(SystemProgram.transfer({ fromPubkey: sender, toPubkey: validReferrer, lamports: referralFee }));
        tx.add(SystemProgram.transfer({ fromPubkey: sender, toPubkey: creatorKey, lamports: creatorFee }));
    } else {
        // STANDARD SPLIT
        const platformFee = Math.floor(totalLamports * 0.10);
        const creatorFee = totalLamports - platformFee;

        tx.add(SystemProgram.transfer({ fromPubkey: sender, toPubkey: PLATFORM_WALLET, lamports: platformFee }));
        tx.add(SystemProgram.transfer({ fromPubkey: sender, toPubkey: creatorKey, lamports: creatorFee }));
    }
    
    tx.feePayer = sender;
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    // Serialize the transaction
    const payload = await tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");

    return NextResponse.json({
      transaction: payload,
      message: `Unlocked Video!`,
    }, {
      headers: ACTIONS_CORS_HEADERS,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to build transaction" }, { status: 500, headers: ACTIONS_CORS_HEADERS });
  }
}

// Standard Headers for Solana Actions
const ACTIONS_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Encoding, Accept-Encoding",
  "Content-Type": "application/json",
};