# VeilVibe

**VeilVibe** – Premium short videos, veiled behind a tiny Solana paywall.  

Creators upload short clips and can mark them as premium. Viewers watch free teasers — pay just **0.0001 SOL** (~$0.02) to lift the veil and watch the full video.

Revenue split (in one atomic Solana transaction):
- **10%** → platform treasury
- **45%** → creator
- **45%** → referrer (only if unlocked via their shared link)

**Live Demo**: https://velivibe.vercel.app

## Features

- TikTok-style vertical swipe feed
- Real-time video updates (Supabase Realtime)
- Free 5-second teasers for premium content
- Auto-pay option (unlocks automatically at 4.5s if enabled and balance sufficient)
- FOMO social proof badges ("X people unlocked this")
- Scoped referrals — referrer earns 45% only on the exact shared video
- Creator dashboard with earnings breakdown (video income + referrals)
- One-tap withdraw from session wallet
- Session wallet system for frictionless micropayments + rent-trap protection
- Confetti & ka-ching animations on unlock/income
- ImageKit-powered fast video upload & delivery

## Tech Stack

- **Frontend**: Next.js (App Router) + Tailwind CSS + Lucide icons
- **Blockchain**: Solana web3.js (SystemProgram transfers for atomic splits)
- **Database & Realtime**: Supabase (Postgres + Realtime subscriptions)
- **Media Storage/Delivery**: ImageKit.io
- **RPC**: Helius (devnet – easy switch to mainnet)
- **Wallet Integration**: @solana/wallet-adapter-react (Phantom, etc.)
- **Deployment**: Vercel

## Quick Start (Local Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/veilvibe.git
   cd veilvibe

2. **Clone the repository**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install

3. **Set up environment variables**
   ```bash
   # Supabase (public keys are safe with Row Level Security)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # ImageKit
   NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_public_key
   NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

   # Helius RPC API key
   HELIUS_API_KEY=your_helius_api_key

   # Platform treasury wallet (receives 10% fee)
   NEXT_PUBLIC_PLATFORM_WALLET=your_platform_wallet_address

## Tech Stack
### Free accounts available at:
- https://supabase.com
- https://imagekit.io
- https://helius.dev


4.**Run the app**
  ```bash
    npm run dev
```
#### Open http://localhost:3000


## Deployment

Live on Vercel: https://velivibe.vercel.app

To deploy your own:

1. Push code to GitHub
2. Import repo in Vercel
3. Add the same environment variables in Vercel Dashboard → Settings → Environment Variables
4. Deploy (auto-deploys on every push)

**VeilVibe** — Tease the vibe. Pay to unveil.  

Built with ❤️ on Solana.




















