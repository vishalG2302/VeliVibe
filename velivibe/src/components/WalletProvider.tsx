"use client";
import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

export default function AppWalletProvider({ children }: { children: React.ReactNode }) {
  // ⬇️ PASTE YOUR HELIUS URL HERE
  // const endpoint = "https://devnet.helius-rpc.com/?api-key=af19eb8a-2f44-4fda-9f28-8b85efef9b2a";
  const endpoint = process.env.NEXT_PUBLIC_HELIUS_API_ENDPOINT;
  
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}







// "use client";
// import React, { useMemo } from "react";
// import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
// import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
// import "@solana/wallet-adapter-react-ui/styles.css";

// export default function AppWalletProvider({ children }: { children: React.ReactNode }) {
//   const endpoint = "https://devnet.helius-rpc.com/?api-key=af19eb8a-2f44-4fda-9f28-8b85efef9b2a"; 
  
//   // 1. Leave wallets empty to use the "Standard Wallet" protocol (best for mobile)
//   const wallets = useMemo(() => [], []);

//   return (
//     <ConnectionProvider endpoint={endpoint}>
//       {/* 2. FIX: Set autoConnect to false to prevent the "Unauthorized" error on load */}
//       <WalletProvider wallets={wallets} autoConnect={false}>
//         <WalletModalProvider>{children}</WalletModalProvider>
//       </WalletProvider>
//     </ConnectionProvider>
//   );
// }