"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Heart, MessageCircle, Lock, Play, Sparkles, Zap, Share2, Coins, Wallet } from "lucide-react"; 
import { useWallet } from "@solana/wallet-adapter-react";
import { useSearchParams } from "next/navigation"; 
import { getOrCreateSessionWallet } from "../utils/sessionWallet";
import { getUnlockedVideoIds, recordTransaction } from "../utils/supabase";
import { Video } from "@/src/types/index";

// PLATFORM TREASURY WALLET
// const PLATFORM_WALLET = "VqEffEbCeg1RvfdSudhHj7pHKZzBwszMh1csZ6x5qLz";
const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET; 

// Add a safety check (good for demo)
if (!PLATFORM_WALLET) {
    throw new Error("PLATFORM_WALLET not set in env");
}


// Fake Social Proof Helper
const getSocialCount = (id: number) => Math.floor((id * 9342) % 500) + 120;

// --- SINGLE VIDEO CARD COMPONENT (UNCHANGED) ---
const VideoCard = ({ 
    video, 
    index,
    activeIndex,
    isUnlocked, 
    isOwner, 
    globalMuted,
    toggleGlobalMute,
    onUnlock,
    currentUserWallet,
    autoPayEnabled, 
    balance,
    incomingAmount
}: { 
    video: Video, 
    index: number,
    activeIndex: number | null,
    isUnlocked: boolean, 
    isOwner: boolean, 
    globalMuted: boolean,
    toggleGlobalMute: () => void,
    onUnlock: (v: Video, isAuto?: boolean) => void,
    currentUserWallet: string | null,
    autoPayEnabled: boolean,
    balance: number,
    incomingAmount: number | null
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [teaserEnded, setTeaserEnded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Spam Prevention Guard
    const autoPayAttempted = useRef(false);

    const isActive = index === activeIndex;
    const shouldPreload = isActive || (activeIndex !== null && index === activeIndex + 1);

    // Reset state if unlocked
    useEffect(() => {
        if (isUnlocked || isOwner) {
            setTeaserEnded(false);
            autoPayAttempted.current = false; 
        }
    }, [isUnlocked, isOwner]);

    // Handle Scroll Activation
    useEffect(() => {
        if (!videoRef.current) return;

        if (isActive) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    if (videoRef.current) {
                        videoRef.current.muted = true;
                        videoRef.current.play();
                    }
                });
            }
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            videoRef.current.currentTime = 0; 
            setIsPlaying(false);
            if (!isUnlocked && !isOwner) {
                 setTeaserEnded(false);
                 autoPayAttempted.current = false; 
            }
        }
    }, [isActive, isUnlocked, isOwner]);

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const current = videoRef.current.currentTime;

        // --- SMART AUTO-PAY TRIGGER (At 4.5s) ---
        if (
            video.isPremium && 
            !isUnlocked && 
            !isOwner && 
            autoPayEnabled && 
            !autoPayAttempted.current && 
            current >= 4.5
        ) {
            const SAFE_THRESHOLD = 0.0012; 

            if (balance > SAFE_THRESHOLD) {
                console.log(`🤖 Auto-Paying for Video ${video.id}...`);
                autoPayAttempted.current = true; 
                onUnlock(video, true); 
            }
        }

        // --- TEASER ENFORCER (At 5.0s) ---
        if (video.isPremium && !isUnlocked && !isOwner && current >= 5) {
            videoRef.current.pause();
            videoRef.current.currentTime = 5; 
            setTeaserEnded(true);
            setIsPlaying(false);
        }
    };

    const handleTapVideo = () => {
        if (!videoRef.current) return;
        if (teaserEnded && !isUnlocked && !isOwner) return;

        if (globalMuted) {
            toggleGlobalMute(); 
            videoRef.current.muted = false; 
        }

        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };
    
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = globalMuted;
        }
    }, [globalMuted]);

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const baseUrl = window.location.origin;
        const params = new URLSearchParams();
        params.set("video", video.id.toString());
        if (currentUserWallet) params.set("ref", currentUserWallet);
        const shareUrl = `${baseUrl}?${params.toString()}`;
        
        navigator.clipboard.writeText(shareUrl);
        alert(`🔗 Specific Video Link Copied!\n\n${shareUrl}\n\nIf they unlock THIS video, you get 45%. If they scroll away, you get 0%.`);
    };

    return (
        <div className="video-card h-full w-full snap-start relative flex items-center bg-gray-900 justify-center" data-index={index}>
            <video 
                ref={videoRef}
                src={video.url} 
                className={`w-full h-full object-cover transition-all duration-700 ${teaserEnded ? "scale-110 blur-xl brightness-50" : ""}`}
                onClick={handleTapVideo} 
                muted={globalMuted} 
                loop
                playsInline 
                preload={shouldPreload ? "auto" : "none"} 
                onTimeUpdate={handleTimeUpdate} 
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />

            {teaserEnded && !isUnlocked && !isOwner && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-30 animate-in fade-in duration-500">
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-black/60 to-black/80"></div>
                    <div className="relative z-10 flex flex-col items-center text-center p-6 w-full max-w-xs">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full flex items-center gap-2 mb-6 shadow-xl animate-bounce">
                            <span className="text-orange-400">🔥</span>
                            <span className="text-xs font-bold text-white tracking-wide">{getSocialCount(video.id)} people unlocked this</span>
                        </div>
                        <Lock size={56} className="text-white mb-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                        <h2 className="text-white font-bold text-3xl mb-2 tracking-tight">Teaser Ended</h2>
                        <p className="text-purple-200 text-sm mb-8 font-medium">
                            Finish watching for <span className="text-white font-bold">0.0001 SOL</span>
                        </p>
                        <button onClick={() => onUnlock(video, false)} className="group relative w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all active:scale-95">
                            <div className="flex items-center justify-center gap-2">
                                <Sparkles size={20} className="group-hover:animate-spin" />
                                <span>Instant Unlock</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent pt-32 z-20 pointer-events-none transition-opacity duration-300 ${teaserEnded ? 'opacity-0' : 'opacity-100'}`}>
                <div className="flex justify-between items-end">
                    <div className="max-w-[80%]">
                        <h3 className="text-white font-bold text-lg drop-shadow-md flex items-center gap-2">
                            @{video.creator.slice(0,6)}...
                            {video.isPremium && <span className="bg-purple-600/80 backdrop-blur-sm border border-purple-400/30 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Premium</span>}
                            {isOwner && <span className="bg-blue-600/80 backdrop-blur-sm text-[9px] px-2 py-0.5 rounded-full uppercase font-bold">You</span>}
                        </h3>
                        <p className="text-gray-200 text-sm drop-shadow-md line-clamp-2 mt-1">{video.title}</p>
                    </div>
                    
                    {/* ACTIONS SIDEBAR (Right) */}
                    <div className="flex flex-col gap-4 items-center mb-4 pointer-events-auto">
                        
                        {/* --- EARNINGS BUTTON --- */}
                        <div className="relative flex flex-col items-center">
                            
                            {/* The Floating Cash Text */}
                            {incomingAmount && (
                                <div className="absolute -top-10 animate-out fade-out slide-out-to-top-6 duration-[2000ms] flex flex-col items-center z-50">
                                    <span className="text-white font-black text-xs drop-shadow-md bg-gradient-to-r from-purple-600 to-pink-600 px-2 py-1 rounded-full border border-pink-400/50 shadow-[0_0_15px_rgba(219,39,119,0.5)]">
                                        +{incomingAmount.toFixed(5)}
                                    </span>
                                </div>
                            )}

                            {/* The SOL/Coins Button */}
                            <button className={`p-3 rounded-full backdrop-blur-md border transition-all duration-300 
                                ${incomingAmount 
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-pink-400 text-white shadow-[0_0_20px_rgba(219,39,119,0.6)] scale-110' 
                                    : 'bg-white/10 border-transparent text-white hover:bg-white/20' 
                                }`}
                            >
                                <Wallet 
                                    size={24} 
                                    className={incomingAmount ? "fill-white/30 animate-bounce drop-shadow-md" : ""} 
                                />
                            </button>
                            <span className={`text-[10px] font-medium mt-1 drop-shadow-md transition-colors ${incomingAmount ? 'text-pink-300 font-bold' : 'text-white/80'}`}>
                                Earn
                            </span>
                        </div>

                        {/* Standard Actions */}
                        <div className="flex flex-col items-center">
                            <button className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/20 transition"><Heart size={24} /></button>
                            <span className="text-[10px] font-medium text-white/80 mt-1">Like</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <button className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/20 transition"><MessageCircle size={24} /></button>
                            <span className="text-[10px] font-medium text-white/80 mt-1">Chat</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <button onClick={handleShare} className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-green-500/20 transition border border-transparent hover:border-green-400">
                                <Share2 size={24} />
                            </button>
                            <span className="text-[10px] font-medium text-white/80 mt-1">Share</span>
                        </div>

                    </div>
                </div>
            </div>

            {!isPlaying && !teaserEnded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/30 p-5 rounded-full backdrop-blur-sm ring-1 ring-white/20"><Play size={36} className="text-white fill-white" /></div>
                </div>
            )}
        </div>
    );
};

// --- MAIN FEED (UPDATED WITH SORTING LOGIC) ---
export default function VideoFeed({ videos = [], startVideo }: { videos?: Video[], startVideo?: Video | null }) {
  const [balance, setBalance] = useState(0);
  const [unlockedVideos, setUnlockedVideos] = useState<Set<number>>(new Set());
  const [sessionWallet, setSessionWallet] = useState<any>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [globalMuted, setGlobalMuted] = useState(true);
  
  // STATE: Auto-Pay Preference
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  
  // STATE: Animations
  const [isSpending, setIsSpending] = useState(false);
  const [incomingAmount, setIncomingAmount] = useState<number | null>(null);
  
  // REFS: Track balance to detect income
  const prevMainBalanceRef = useRef<number>(0);

  const { publicKey: mainWallet, sendTransaction } = useWallet();
  const containerRef = useRef<HTMLDivElement>(null);
  const isFetching = useRef(false);

  const searchParams = useSearchParams();
  const referrerWallet = searchParams.get('ref'); 
  const referredVideoId = searchParams.get('video');

  // LOAD AUTO-PAY SETTING
  useEffect(() => {
    const saved = localStorage.getItem("tiptok_autopay");
    if (saved === "true") setAutoPayEnabled(true);
  }, []);

  // --- SORTING LOGIC: Uses 'startVideo' to prioritize ---
  const sortedVideos = useMemo(() => {
    // 1. Priority: Direct Click from Dashboard (via startVideo prop)
    if (startVideo) {
        // Safe String comparison
        const targetIndex = videos.findIndex(v => String(v.id) === String(startVideo.id));
        
        if (targetIndex !== -1) {
            // Case A: Video exists in feed -> Move it to top
            const newOrder = [...videos];
            const [targetVideo] = newOrder.splice(targetIndex, 1);
            newOrder.unshift(targetVideo);
            return newOrder;
        } else {
            // Case B: Video is missing (stale feed), force inject it at top
            return [startVideo, ...videos];
        }
    }
    
    // 2. Fallback: Deep Link from URL
    if (referredVideoId && videos.length > 0) {
        const targetId = Number(referredVideoId);
        const targetIndex = videos.findIndex(v => v.id === targetId);
        if (targetIndex !== -1) {
            const newOrder = [...videos];
            const [targetVideo] = newOrder.splice(targetIndex, 1);
            newOrder.unshift(targetVideo);
            return newOrder;
        }
    }
    return videos;
  }, [videos, referredVideoId, startVideo]);

  // --- AUTO-SCROLL TO TOP (Corrected) ---
  useEffect(() => {
      if (containerRef.current) {
          // Small delay to ensure DOM has updated with new sort order
          setTimeout(() => {
              containerRef.current?.scrollTo({ top: 0, behavior: "auto" });
          }, 50);
      }
      
      const observer = new IntersectionObserver(
          (entries) => {
              entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                      const index = Number(entry.target.getAttribute('data-index'));
                      setActiveIndex(index);
                  }
              });
          },
          { root: containerRef.current, threshold: 0.6 }
      );
      const cards = document.querySelectorAll('.video-card');
      cards.forEach((card) => observer.observe(card));
      return () => observer.disconnect();
  }, [sortedVideos]);

  const toggleGlobalMute = () => setGlobalMuted(!globalMuted);

  const refreshBalance = async () => {
      if (!sessionWallet || !connection) return;
      try {
          const b = await connection.getBalance(sessionWallet.publicKey);
          setBalance(b / LAMPORTS_PER_SOL);
      } catch (e) { console.error("Refresh bal error", e); }
  };

  // --- DUAL WALLET LISTENER ---
  useEffect(() => {
    const wallet = getOrCreateSessionWallet();
    const conn = new Connection("https://devnet.helius-rpc.com/?api-key=af19eb8a-2f44-4fda-9f28-8b85efef9b2a", "confirmed");
    setSessionWallet(wallet);
    setConnection(conn);

    // 1. FETCH INITIAL DATA
    const fetchInitial = async () => { 
        if (isFetching.current) return;
        isFetching.current = true;
        try {
            // Session Balance
            const b = await conn.getBalance(wallet.publicKey); 
            setBalance(b / LAMPORTS_PER_SOL);
            
            // Unlocks
            const viewerKey = mainWallet ? mainWallet.toBase58() : wallet.publicKey.toBase58();
            const ids = await getUnlockedVideoIds(viewerKey);
            setUnlockedVideos(new Set(ids));

            // Main Wallet Balance (For Ref Comparison)
            if (mainWallet) {
                const mb = await conn.getBalance(mainWallet);
                prevMainBalanceRef.current = mb / LAMPORTS_PER_SOL;
            }
        } catch (e: any) { 
            if (!e.toString().includes("429")) console.warn("Balance fetch error:", e);
        } finally {
            isFetching.current = false;
        }
    };
    fetchInitial(); 
    
    // 2. LISTEN TO SESSION WALLET (Updates Tip Balance)
    const sessionSubId = conn.onAccountChange(
        wallet.publicKey,
        (updatedAccountInfo) => {
            setBalance(updatedAccountInfo.lamports / LAMPORTS_PER_SOL);
        },
        "confirmed"
    );

    // 3. LISTEN TO MAIN WALLET (Detects Incoming Referral/Creator $$$)
    let mainSubId: number | null = null;
    if (mainWallet) {
        mainSubId = conn.onAccountChange(
            mainWallet,
            (updatedAccountInfo) => {
                const newBalance = updatedAccountInfo.lamports / LAMPORTS_PER_SOL;
                const diff = newBalance - prevMainBalanceRef.current;

                // Logic: If balance goes UP by a small amount, it's income!
                if (diff > 0.000001 && diff < 0.5) {
                    console.log("💰 INCOME DETECTED:", diff);
                    setIncomingAmount(diff);
                    setTimeout(() => setIncomingAmount(null), 4000); // 4s Animation
                }
                prevMainBalanceRef.current = newBalance;
            },
            "confirmed"
        );
    }

    return () => { 
        conn.removeAccountChangeListener(sessionSubId); 
        if (mainSubId) conn.removeAccountChangeListener(mainSubId);
    };
  }, [mainWallet]); 

  const handleDeposit = async () => {
      if (!sessionWallet || !mainWallet) {
          alert("Please connect your Phantom Wallet first (Go to Earn -> Profile).");
          return;
      }
      try {
          const transaction = new Transaction().add(
              SystemProgram.transfer({
                  fromPubkey: mainWallet,
                  toPubkey: sessionWallet.publicKey,
                  lamports: 0.5 * LAMPORTS_PER_SOL 
              })
          );
          await sendTransaction(transaction, connection!);
          alert("Deposit Sent! Updating...");
          setTimeout(refreshBalance, 2000);
      } catch (error) { alert("Deposit Failed."); }
  };

  const handleUnlock = async (video: Video, isAuto: boolean = false) => {
      if (!sessionWallet || !connection) return;

      const VIDEO_PRICE = 0.0001;
      const TX_FEE = 0.000005; 
      const RENT_EXEMPT_MIN = 0.001; 

      if (balance < VIDEO_PRICE + TX_FEE) {
          if(!isAuto && confirm("Insufficient Balance! Deposit 0.5 SOL?")) handleDeposit();
          return;
      }

      const remainingBalance = balance - (VIDEO_PRICE + TX_FEE);
      if (remainingBalance > 0 && remainingBalance < RENT_EXEMPT_MIN) {
          if (!isAuto) alert(`Transaction Rejected. Balance would drop to ${remainingBalance.toFixed(5)} SOL (Rent Trap). Please Top Up.`);
          return;
      }

      setUnlockedVideos(prev => new Set(prev).add(video.id)); 
      
      // TRIGGER SPENDING ANIMATION
      setIsSpending(true);
      setTimeout(() => setIsSpending(false), 2000);

      try {
        const tx = new Transaction();
        const totalLamports = VIDEO_PRICE * LAMPORTS_PER_SOL;

        let validReferrer = null;
        if (referrerWallet) {
            if (referredVideoId === video.id.toString()) {
                if (referrerWallet !== sessionWallet.publicKey.toBase58() && referrerWallet !== video.creator) {
                    try { 
                        new PublicKey(referrerWallet); 
                        validReferrer = referrerWallet; 
                    } catch (e) { console.warn("Invalid Referrer Key"); }
                }
            }
        }

        let platformLamports = Math.floor(totalLamports * 0.10); 
        let referralLamports = 0;
        let creatorLamports = 0;

        if (validReferrer) {
            referralLamports = Math.floor(totalLamports * 0.45); 
            creatorLamports = totalLamports - platformLamports - referralLamports; 
        } else {
            creatorLamports = totalLamports - platformLamports; 
        }

        tx.add(SystemProgram.transfer({ fromPubkey: sessionWallet.publicKey, toPubkey: new PublicKey(PLATFORM_WALLET as string), lamports: platformLamports }));
        if (validReferrer && referralLamports > 0) {
            tx.add(SystemProgram.transfer({ fromPubkey: sessionWallet.publicKey, toPubkey: new PublicKey(validReferrer), lamports: referralLamports }));
        }
        tx.add(SystemProgram.transfer({ fromPubkey: sessionWallet.publicKey, toPubkey: new PublicKey(video.creator), lamports: creatorLamports }));

        const signature = await connection.sendTransaction(tx, [sessionWallet]);
        const viewerKey = mainWallet ? mainWallet.toBase58() : sessionWallet.publicKey.toBase58();
        
        await recordTransaction(viewerKey, video.creator, creatorLamports / LAMPORTS_PER_SOL, video.id, signature);
        await recordTransaction(viewerKey, PLATFORM_WALLET, platformLamports / LAMPORTS_PER_SOL, video.id, signature);
        if (validReferrer && referralLamports > 0) {
            await recordTransaction(viewerKey, validReferrer, referralLamports / LAMPORTS_PER_SOL, video.id, signature);
        }
        
        setBalance(prev => prev - VIDEO_PRICE);
      } catch (err) {
        console.error(err);
        setUnlockedVideos(prev => { const newSet = new Set(prev); newSet.delete(video.id); return newSet; });
        setIsSpending(false); // Cancel animation
        if (!isAuto) alert("Payment Failed: " + (err instanceof Error ? err.message : "Unknown Error"));
      }
  };

  const unlocksLeft = Math.floor(balance / 0.0001);

  if (videos.length === 0) return <div className="h-full flex items-center justify-center bg-black text-gray-500">No videos yet.</div>;

  return (
    <div className="bg-black h-full w-full relative">
       
       {/* --- TOP BAR (FIXED UI) --- */}
       <div className="absolute top-0 w-full z-50 p-4 pointer-events-none">
         <div className="flex justify-between items-start">
             
             {/* BALANCE CARD (Horizontal Widget) */}
             <div className={`pointer-events-auto bg-black/60 backdrop-blur-xl p-2 pr-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3 relative overflow-visible transition-all duration-300 ${isSpending ? 'border-purple-500/50 bg-purple-900/20' : ''}`}>
                
                {/* FLOATING EXPENSE ANIMATION */}
                {isSpending && (
                    <div className="absolute right-0 -bottom-6 text-purple-400 text-sm font-bold font-mono animate-out fade-out slide-out-to-bottom-4 duration-1000 z-50 flex items-center gap-1">
                        -0.0001 <span className="text-[8px]">SOL</span>
                    </div>
                )}

                {/* LEFT: ICON BOX */}
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shadow-inner transition-colors duration-300 ${isSpending ? 'bg-purple-500/20 border-purple-500/50' : 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-white/5'}`}>
                    <Zap 
                        size={20} 
                        className={`transition-colors duration-300 ${isSpending ? 'text-purple-400 fill-purple-400/50' : 'text-yellow-400 fill-yellow-400/50'}`} 
                    />
                </div>

                {/* RIGHT: TEXT STACK */}
                <div className="flex flex-col justify-center">
                    
                    {/* Balance Row */}
                    <div className="flex items-baseline gap-1.5">
                        <span className={`font-mono font-bold text-lg leading-none transition-all duration-200 ${isSpending ? 'text-purple-300 scale-105' : 'text-white'}`}>
                            {balance.toFixed(5)}
                        </span>
                        <span className="text-white/40 text-[9px] font-bold tracking-wider">SOL</span>
                    </div>

                    {/* Unlocks Left Row */}
                    {balance > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${isSpending ? 'bg-purple-500 animate-ping' : 'bg-green-500'}`}></div>
                            <span className="text-green-400/90 text-[10px] font-medium tracking-wide leading-none">
                                {unlocksLeft} unlocks
                            </span>
                        </div>
                    )}
                </div>
             </div>

             <button onClick={handleDeposit} className="pointer-events-auto bg-black/40 backdrop-blur-md px-4 py-2 rounded-full font-bold text-white hover:bg-white/20 transition active:scale-95 text-xs flex items-center gap-1 border border-white/10 shadow-lg ">
                + Top Up
             </button>
         </div>
       </div>

       <div ref={containerRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
        {sortedVideos.map((v, idx) => (
            <VideoCard 
                key={v.id} 
                index={idx} 
                video={v} 
                activeIndex={activeIndex} 
                isUnlocked={unlockedVideos.has(v.id)} 
                isOwner={mainWallet?.toBase58() === v.creator} 
                globalMuted={globalMuted} 
                toggleGlobalMute={toggleGlobalMute} 
                onUnlock={handleUnlock} 
                currentUserWallet={mainWallet ? mainWallet.toBase58() : null}
                autoPayEnabled={autoPayEnabled} 
                balance={balance} 
                incomingAmount={idx === activeIndex ? incomingAmount : null} 
            />
        ))}
      </div>
    </div>
  );
}
