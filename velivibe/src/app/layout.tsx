import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppWalletProvider from "@/src/components/WalletProvider";

const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = { title: "VeilVibe", description: "Solana Video App" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppWalletProvider>{children}</AppWalletProvider>
      </body>
    </html>
  );
}



