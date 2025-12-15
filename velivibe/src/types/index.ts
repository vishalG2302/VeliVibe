export interface User {
    wallet_address: string;
    username?: string;
}

export interface Video {
    id: number;
    url: string;
    creator: string; // Wallet Address
    title: string;
    isPremium: boolean;
    price: number;
}

export interface Transaction {
    id: number;
    sender_wallet: string;
    video_id: number;
    signature: string;
}