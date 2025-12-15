// import { createClient } from '@supabase/supabase-js';
// import { Video } from '@/src/types/index'; 

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// export const supabase = createClient(supabaseUrl, supabaseKey);

// export const ensureUserExists = async (walletAddress: string) => {
//   const { data } = await supabase.from('users').select('wallet_address').eq('wallet_address', walletAddress).single();
//   if (!data) {
//     await supabase.from('users').insert({ 
//         wallet_address: walletAddress,
//         username: `User ${walletAddress.slice(0,4)}`
//     });
//   }
// };

// export const saveVideoToDB = async (walletAddress: string, videoUrl: string, isPremium: boolean, caption: string) => {
//   await ensureUserExists(walletAddress);
//   const { error } = await supabase.from('videos').insert({ 
//       owner_wallet: walletAddress, 
//       video_url: videoUrl,
//       is_premium: isPremium,
//       price_sol: isPremium ? 0.0001 : 0, 
//       caption: caption || "No caption"
//   });
//   if (error) throw error;
// };

// export const fetchVideosFromDB = async (ownerAddress?: string): Promise<Video[]> => {
//   let query = supabase.from('videos').select('*').order('created_at', { ascending: false });
//   if (ownerAddress) query = query.eq('owner_wallet', ownerAddress);

//   const { data, error } = await query;
//   if (error) throw error;
  
//   return data.map((vid: any) => ({
//       id: vid.id,
//       url: vid.video_url,
//       creator: vid.owner_wallet,
//       title: vid.caption,
//       isPremium: vid.is_premium,
//       price: vid.price_sol
//   }));
// };

// export const fetchPurchasedVideos = async (walletAddress: string): Promise<Video[]> => {
//     const { data: txs } = await supabase.from('transactions').select('video_id').eq('sender_wallet', walletAddress);
//     if (!txs || txs.length === 0) return [];

//     const videoIds = txs.map(t => t.video_id);
//     const { data, error } = await supabase.from('videos').select('*').in('id', videoIds);
//     if (error) throw error;

//     return data.map((vid: any) => ({
//         id: vid.id,
//         url: vid.video_url,
//         creator: vid.owner_wallet,
//         title: vid.caption,
//         isPremium: vid.is_premium,
//         price: vid.price_sol
//     }));
// };

// export const getLifetimeEarnings = async (walletAddress: string): Promise<number> => {
//     const { data } = await supabase
//         .from('transactions')
//         .select('amount_sol')
//         .eq('receiver_wallet', walletAddress);
    
//     if (!data) return 0;
//     return data.reduce((sum, tx) => sum + tx.amount_sol, 0);
// };

// export const recordTransaction = async (sender: string, receiver: string, amount: number, videoId: number, signature: string) => {
//     await supabase.from('transactions').insert({
//         sender_wallet: sender,
//         receiver_wallet: receiver,
//         amount_sol: amount,
//         video_id: videoId,
//         signature: signature
//     });
// };

// export const getUnlockedVideoIds = async (walletAddress: string): Promise<number[]> => {
//     const { data } = await supabase.from('transactions').select('video_id').eq('sender_wallet', walletAddress);
//     return data ? data.map((tx: any) => tx.video_id) : [];
// };

import { createClient } from '@supabase/supabase-js';
import { Video } from '@/src/types/index'; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const ensureUserExists = async (walletAddress: string) => {
  const { data } = await supabase.from('users').select('wallet_address').eq('wallet_address', walletAddress).single();
  if (!data) {
    await supabase.from('users').insert({ 
        wallet_address: walletAddress,
        username: `User ${walletAddress.slice(0,4)}`
    });
  }
};

export const saveVideoToDB = async (walletAddress: string, videoUrl: string, isPremium: boolean, caption: string) => {
  await ensureUserExists(walletAddress);
  const { error } = await supabase.from('videos').insert({ 
      owner_wallet: walletAddress, 
      video_url: videoUrl,
      is_premium: isPremium,
      price_sol: isPremium ? 0.0001 : 0, 
      caption: caption || "No caption"
  });
  if (error) throw error;
};

export const fetchVideosFromDB = async (ownerAddress?: string): Promise<Video[]> => {
  let query = supabase.from('videos').select('*').order('created_at', { ascending: false });
  if (ownerAddress) query = query.eq('owner_wallet', ownerAddress);

  const { data, error } = await query;
  if (error) throw error;
  
  return data.map((vid: any) => ({
      id: vid.id,
      url: vid.video_url,
      creator: vid.owner_wallet,
      title: vid.caption,
      isPremium: vid.is_premium,
      price: vid.price_sol
  }));
};

export const fetchPurchasedVideos = async (walletAddress: string): Promise<Video[]> => {
    const { data: txs } = await supabase.from('transactions').select('video_id').eq('sender_wallet', walletAddress);
    if (!txs || txs.length === 0) return [];

    const videoIds = txs.map(t => t.video_id);
    const { data, error } = await supabase.from('videos').select('*').in('id', videoIds);
    if (error) throw error;

    return data.map((vid: any) => ({
        id: vid.id,
        url: vid.video_url,
        creator: vid.owner_wallet,
        title: vid.caption,
        isPremium: vid.is_premium,
        price: vid.price_sol
    }));
};

export const getLifetimeEarnings = async (walletAddress: string): Promise<number> => {
    const { data } = await supabase
        .from('transactions')
        .select('amount_sol')
        .eq('receiver_wallet', walletAddress);
    
    if (!data) return 0;
    return data.reduce((sum, tx) => sum + tx.amount_sol, 0);
};

export const recordTransaction = async (sender: string, receiver: string, amount: number, videoId: number, signature: string) => {
    await supabase.from('transactions').insert({
        sender_wallet: sender,
        receiver_wallet: receiver,
        amount_sol: amount,
        video_id: videoId,
        signature: signature
    });
};

export const getUnlockedVideoIds = async (walletAddress: string): Promise<number[]> => {
    const { data } = await supabase.from('transactions').select('video_id').eq('sender_wallet', walletAddress);
    return data ? data.map((tx: any) => tx.video_id) : [];
};

// --- NEW FUNCTION: SEPARATE SALES VS REFERRALS ---
export const getFinancialStats = async (walletAddress: string) => {
    // 1. Fetch transactions where I am the receiver
    // 2. Join with the 'videos' table to see who owns the video for that transaction
    const { data, error } = await supabase
        .from('transactions')
        .select(`
            amount_sol,
            video_id,
            videos (
                owner_wallet
            )
        `)
        .eq('receiver_wallet', walletAddress);

    if (error || !data) {
        console.error("Error fetching financial stats:", error);
        return { creatorEarnings: 0, referralEarnings: 0 };
    }

    let creatorEarnings = 0;
    let referralEarnings = 0;

    data.forEach((tx: any) => {
        // We look at the video attached to this transaction
        const videoOwner = tx.videos?.owner_wallet;

        if (videoOwner === walletAddress) {
            // I own this video -> I earned this money as a Creator
            creatorEarnings += tx.amount_sol;
        } else {
            // I do NOT own this video, but I received money -> I earned this as a Referrer
            referralEarnings += tx.amount_sol;
        }
    });

    return { creatorEarnings, referralEarnings };
};