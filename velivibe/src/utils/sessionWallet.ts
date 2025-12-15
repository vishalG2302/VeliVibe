import { Keypair } from "@solana/web3.js";

export const getOrCreateSessionWallet = (): Keypair => {
  if (typeof window === 'undefined') return Keypair.generate();

  const storedKey = localStorage.getItem("tiptok_session_key");
  if (storedKey) {
    try {
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(storedKey)));
    } catch (e) {
      console.warn("Key corrupted, resetting.");
    }
  }
  
  const newKeypair = Keypair.generate();
  localStorage.setItem("tiptok_session_key", JSON.stringify(Array.from(newKeypair.secretKey)));
  return newKeypair;
};