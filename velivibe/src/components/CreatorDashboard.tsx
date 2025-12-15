"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js";
import { Settings, TrendingUp, Copy, Wallet, Video as VideoIcon, Lock, LogOut, ArrowLeft, X, Coins, Share2, PlayCircle, ExternalLink, Zap } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { getOrCreateSessionWallet } from "../utils/sessionWallet";
import { fetchVideosFromDB, fetchPurchasedVideos, getFinancialStats } from "../utils/supabase"; 
import { Video } from "../types/index";

// Define the new props interface
interface CreatorDashboardProps {
    onBack: () => void;
    // NEW PROP: Function to call when a  video is selected
    onVideoSelect: (video: Video) => void; 
}

// Update the component signature
export default function CreatorDashboard({ onBack, onVideoSelect }: CreatorDashboardProps) {
    const { connection } = useConnection();
    const { publicKey } = useWallet(); 
    
    const sessionWallet = useMemo(() => getOrCreateSessionWallet(), []);
    
    const [mainBalance, setBalance] = useState<number>(0);
    const [sessionBalance, setSessionBalance] = useState<number>(0);
    
    // Stats
    const [creatorEarnings, setCreatorEarnings] = useState<number>(0);
    const [referralEarnings, setReferralEarnings] = useState<number>(0);
    
    // NEW: Auto-Pay State
    const [autoPayEnabled, setAutoPayEnabled] = useState(false);

    const totalEarnings = creatorEarnings + referralEarnings;
    
    const [activeTab, setActiveTab] = useState<'my' | 'library'>('my');
    const [myVideos, setMyVideos] = useState<Video[]>([]);
    const [libraryVideos, setLibraryVideos] = useState<Video[]>([]);
    
    // REMOVE: We no longer need this local state
    // const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

    useEffect(() => {
        const fetchBalances = async () => {
            try {
                if(publicKey) {
                    const b = await connection.getBalance(publicKey);
                    setBalance(b / LAMPORTS_PER_SOL);
                }
                const sb = await connection.getBalance(sessionWallet.publicKey);
                setSessionBalance(sb / LAMPORTS_PER_SOL);
            } catch (e: any) {
                if (!e.toString().includes("429")) console.warn("Rate limit");
            }
        };
        fetchBalances();

        // LOAD AUTO-PAY SETTING
        const savedAutoPay = localStorage.getItem("tiptok_autopay");
        if (savedAutoPay === "true") setAutoPayEnabled(true);

        if (publicKey) {
            fetchVideosFromDB(publicKey.toBase58()).then(vids => setMyVideos(vids));
            fetchPurchasedVideos(publicKey.toBase58()).then(vids => setLibraryVideos(vids));
            
            getFinancialStats(publicKey.toBase58()).then(stats => {
                setCreatorEarnings(stats.creatorEarnings);
                setReferralEarnings(stats.referralEarnings);
            });
        }

    }, [publicKey?.toBase58(), sessionWallet.publicKey.toBase58(), connection]);

    // NEW: Toggle Handler
    const toggleAutoPay = () => {
        const newState = !autoPayEnabled;
        setAutoPayEnabled(newState);
        localStorage.setItem("tiptok_autopay", newState.toString());
    };

    const handleWithdraw = async () => {
        if (!publicKey || sessionBalance <= 0) return;
        const RENT_RESERVE = 0.000005; // Network fee buffer
        if (sessionBalance < RENT_RESERVE) {
            alert(`Balance too low. Leave ${RENT_RESERVE} SOL for fees.`);
            return;
        }
        try {
            const tx = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: sessionWallet.publicKey,
                    toPubkey: publicKey,
                    lamports: Math.floor((sessionBalance - RENT_RESERVE) * LAMPORTS_PER_SOL) 
                })
            );
            await connection.sendTransaction(tx, [sessionWallet]);
            alert("Funds withdrawn!");
            setSessionBalance(0);
        } catch (e) { alert("Withdraw failed."); }
    };

    const handlekillsession = async () => {
        if(sessionBalance > 0.001) await handleWithdraw();
        localStorage.removeItem("tiptok_session_key");
        window.location.reload();
    };

    const displayList = activeTab === 'my' ? myVideos : libraryVideos;

    // NEW CLICK HANDLER: Calls the prop function
    const handleVideoClick = (video: Video) => {
        // 1. Tell the parent component which video was selected
        onVideoSelect(video);
        // 2. The parent component will now switch to the main feed and show the video
    };

    return (
        <div className="min-h-full bg-black text-white p-4 pb-24 font-sans selection:bg-purple-500/30">
            
            {/* HEADER */}
            <div className="flex justify-between items-center mb-8 pt-4">
                <button onClick={onBack} className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold tracking-wide">Profile</h1>
                <div className="flex gap-3">
                    <button 
                        onClick={handlekillsession} 
                        className="group flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full border border-red-500/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95 backdrop-blur-md"
                    >
                        {/* <Power size={16} className="group-hover:scale-110 transition-transform" /> */}
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                            Kill Session
                        </span>
                    </button>
                </div>
            </div>

            {/* PROFILE SECTION */}
            <div className="flex flex-col items-center mb-10 z-50 relative">
                {/* Glow Effect */}
                <div className="absolute top-0 w-32 h-32 bg-purple-600/30 blur-[50px] rounded-full pointer-events-none"></div>
                
                <div className="w-24 h-24 bg-gradient-to-tr from-purple-500 via-violet-500 to-blue-500 rounded-full mb-4 p-1 shadow-2xl relative z-10">
                    <div className="w-full h-full bg-black rounded-full border-4 border-black/50 overflow-hidden">
                        {/* Fallback Avatar or Image */}
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-2xl">
                            👻
                        </div>
                    </div>
                </div>
                
                <h2 className="text-2xl font-bold mb-2">{publicKey ? `@${publicKey.toBase58().slice(0,6)}...${publicKey.toBase58().slice(-4)}` : "Guest"}</h2>
                
                {/* Styled Wallet Adapter Button */}
                <div className="transform scale-90 hover:scale-95 transition-transform duration-200 opacity-90 hover:opacity-100">
                    <WalletMultiButton style={{ backgroundColor: '#1f2937', height: '40px', borderRadius: '20px', fontSize: '14px', fontFamily: 'monospace' }} />
                </div>
            </div>

            {publicKey && (
            <div className="grid grid-cols-2 gap-3 mb-8">
                
                {/* CARD 1: TOTAL EARNINGS (Gradient) */}
                <div className="col-span-2 relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 p-5 rounded-2xl shadow-lg border border-white/10">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><TrendingUp size={80} /></div>
                    <div className="relative z-10">
                        <p className="text-xs text-indigo-100 font-bold tracking-wider mb-1 flex items-center gap-1">
                            TOTAL EARNINGS
                        </p>
                        <p className="text-4xl font-extrabold text-white tracking-tighter flex items-baseline gap-1">
                            {totalEarnings.toFixed(5)} <span className="text-sm font-medium text-indigo-200">SOL</span>
                        </p>
                    </div>
                </div>

                {/* CARD 2: VIDEO EARNINGS */}
                <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 p-3 rounded-xl border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2 text-purple-300">
                        <div className="p-1.5 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition">
                            <PlayCircle size={16} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Video Income</span>
                    </div>
                    <p className="text-xl font-mono font-bold text-white">{creatorEarnings.toFixed(5)}</p>
                </div>

                {/* CARD 3: REFERRAL EARNINGS */}
                <div className="bg-gradient-to-br from-green-900/50 to-teal-900/50 p-3 rounded-xl border border-green-500/30">
                    <div className="flex items-center gap-2 mb-2 text-green-400">
                        <div className="p-1.5 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition">
                            <Share2 size={16} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Referrals</span>
                    </div>
                    <p className="text-xl font-mono font-bold text-white">{referralEarnings.toFixed(5)}</p>
                </div>
                {/* CARD 4: MAIN WALLET */}
                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10 flex flex-col justify-between h-full min-h-[90px]">
                    <div className="flex items-center gap-1.5 text-gray-400">
                        <Wallet size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Main Wallet</span>
                    </div>
                    <p className="text-lg font-mono font-bold text-white tracking-tight mt-1">
                        {mainBalance.toFixed(4)}
                    </p>
                </div>
                
                {/* CARD 5: SESSION WALLET */}
                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10 relative overflow-hidden group flex flex-col justify-between h-full min-h-[90px]">
                    {/* Top Row: Label + Copy */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-yellow-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">VeilVibe Balance</span>
                        </div>
                        <button 
                            onClick={() => { navigator.clipboard.writeText(sessionWallet.publicKey.toBase58()); alert("Address Copied!"); }} 
                            className="text-gray-500 hover:text-white transition-colors p-1 -mr-1"
                        >
                            <Copy size={12} />
                        </button>
                    </div>

                    {/* Bottom Row: Balance + Withdraw Button */}
                    <div className="flex items-end justify-between mt-1">
                        <p className="text-lg font-mono font-bold text-white tracking-tight">
                            {sessionBalance.toFixed(5)}
                        </p>
                        
                        {sessionBalance > 0.0001 && (
                            <button 
                                onClick={handleWithdraw} 
                                className="bg-white/10 hover:bg-white/20 text-white text-[9px] font-bold px-2 py-1 rounded-lg border border-white/10 transition-all flex items-center gap-1 mb-0.5"
                            >
                                Withdraw <ExternalLink size={8} />
                            </button>
                        )}
                    </div>
                </div>

                {/* CARD 6: AUTO-PAY SETTINGS (NEW) */}
                <div onClick={toggleAutoPay} className={`col-span-2 p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${autoPayEnabled ? 'bg-purple-900/30 border-purple-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl transition-colors ${autoPayEnabled ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/5 text-gray-500'}`}>
                            <Zap size={20} className={autoPayEnabled ? "fill-current" : ""} />
                        </div>
                        <div>
                            <p className={`text-sm font-bold ${autoPayEnabled ? 'text-white' : 'text-gray-400'}`}>
                                {autoPayEnabled ? "Auto-Pay Active" : "Auto-Pay Off"}
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium">
                                {autoPayEnabled ? "Seamlessly unlocking videos" : "Tap lock icon to unlock"}
                            </p>
                        </div>
                    </div>
                    
                    {/* Toggle Switch UI */}
                    <div className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative ${autoPayEnabled ? 'bg-purple-500' : 'bg-gray-700/50 border border-white/5'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${autoPayEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                </div>

            </div>
            )}

            {/* TABS (No changes needed here) */}
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 mb-6 relative">
                <button 
                    onClick={() => setActiveTab('my')} 
                    className={`flex-1 py-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 relative z-10 ${activeTab === 'my' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <VideoIcon size={16}/> My Uploads
                </button>
                <button 
                    onClick={() => setActiveTab('library')} 
                    className={`flex-1 py-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 relative z-10 ${activeTab === 'library' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Lock size={16}/> Unlocked
                </button>
            </div>

            {/* VIDEO GRID: Call the new handler here */}
            <div className="grid grid-cols-3 gap-3">
                {displayList.length === 0 ? (
                    <div className="col-span-3 flex flex-col items-center justify-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <VideoIcon size={32} className="mb-2 opacity-50" />
                        <p className="text-xs font-medium">{activeTab === 'my' ? "No uploads yet" : "No unlocked videos"}</p>
                    </div>
                ) : (
                    displayList.map((v) => (
                        <button 
                            key={v.id} 
                            // OLD: onClick={() => setSelectedVideo(v)} 
                            onClick={() => handleVideoClick(v)} // NEW: Use the new handler
                            className="aspect-[9/16] bg-gray-800 rounded-xl overflow-hidden border border-white/5 relative group transition-transform active:scale-95 shadow-lg"
                        >
                            <video src={v.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted />
                            {v.isPremium && (
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[8px] text-purple-300 font-bold border border-purple-500/30">
                                    PREM
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                <PlayCircle size={24} className="text-white drop-shadow-lg" />
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}