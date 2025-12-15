"use client";
import React, { useState, useRef } from "react";
import { IKContext, IKUpload } from "imagekitio-react";
import { ArrowLeft, Loader2, UploadCloud, Lock, Unlock, AlignLeft, DollarSign } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { saveVideoToDB } from "../utils/supabase"; 

interface UploadVideoProps {
    onUploadSuccess: () => void; 
    onBack: () => void;
}

export default function UploadVideo({ onUploadSuccess, onBack }: UploadVideoProps) {
  const { publicKey } = useWallet();
  const [viewState, setViewState] = useState<'select' | 'preview' | 'uploading'>('select');
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [isPremium, setIsPremium] = useState(false);
  const [caption, setCaption] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const ikUploadRef = useRef<HTMLInputElement>(null);

  const authenticator = async () => {
    try {
        const res = await fetch("/api/auth");
        if (!res.ok) throw new Error("Auth API Failed");
        return await res.json();
    } catch (error) { throw error; }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setPreviewUrl(URL.createObjectURL(file));
        setViewState('preview');
        setIsUploading(true);
        setProgress(10);
        const interval = setInterval(() => {
            setProgress((prev) => (prev < 90 ? prev + Math.floor(Math.random() * 10) : prev));
        }, 800);
    }
  };

  const handleImageKitSuccess = (res: any) => {
    setUploadedUrl(res.url);
    setIsUploading(false);
    setProgress(100);
  };

  const handlePostClick = async () => {
      if (!publicKey) { alert("Connect Wallet!"); return; }
      if (!uploadedUrl) { alert("Still uploading... wait."); return; }

      setViewState('uploading'); 

      try {
          await saveVideoToDB(publicKey.toBase58(), uploadedUrl, isPremium, caption);
          setTimeout(() => { onUploadSuccess(); }, 1000);
      } catch (e) {
          console.error("DB Error", e);
          alert("Failed to save post.");
          setViewState('preview');
      }
  };

  if (!publicKey) return <div className="h-full flex items-center justify-center text-white">Please connect wallet to upload.</div>;

  return (
    <div className="h-full flex flex-col bg-black text-white overflow-y-auto no-scrollbar">
      <div className="flex items-center gap-4 p-4 border-b border-gray-800 pt-6">
        <button onClick={onBack} className="p-1"><ArrowLeft size={24} /></button>
        <h1 className="text-xl font-bold">New Post</h1>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-start space-y-6">
        <IKContext 
            publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY} 
            urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT} 
            authenticator={authenticator}
        >
            <IKUpload
                ref={ikUploadRef}
                fileName="tiptok_vid.mp4"
                tags={["tiptok"]}
                useUniqueFileName={true}
                onChange={handleFileSelect}
                onSuccess={handleImageKitSuccess}
                className="hidden"
                accept="video/*"
            />
        </IKContext>

        {viewState === 'select' && (
            <div 
                onClick={() => ikUploadRef.current?.click()}
                className="w-full mt-20 border-2 border-dashed border-gray-700 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 text-gray-400 hover:bg-gray-900 cursor-pointer aspect-[4/5]"
            >
                <UploadCloud size={48} />
                <p>Tap to select video</p>
            </div>
        )}

        {viewState === 'preview' && previewUrl && (
            <div className="w-full max-w-xs space-y-6">
                <div className="aspect-[9/16] bg-gray-900 rounded-xl overflow-hidden border border-gray-700 relative shadow-lg">
                    <video src={previewUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    {isUploading && (
                        <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white flex items-center gap-1">
                            <Loader2 className="animate-spin w-3 h-3" /> Uploading...
                        </div>
                    )}
                </div>

                <div 
                    onClick={() => setIsPremium(!isPremium)}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isPremium ? 'bg-purple-900/20 border-purple-500' : 'bg-gray-900 border-gray-800'}`}
                >
                    <div className="flex items-center gap-3">
                        {isPremium ? <Lock className="text-purple-400" size={20} /> : <Unlock className="text-gray-500" size={20} />}
                        <div>
                            <p className={`font-bold text-sm ${isPremium ? 'text-purple-400' : 'text-gray-300'}`}>
                                {isPremium ? "Premium Content" : "Free Content"}
                            </p>
                            <p className="text-[10px] text-gray-500">
                                {isPremium ? "Locked (Pay to watch)" : "Visible to everyone"}
                            </p>
                        </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${isPremium ? 'bg-purple-500' : 'bg-gray-700'}`}>
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isPremium ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                </div>

                {isPremium && (
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-900 rounded-xl border border-gray-800">
                        <div className="flex items-center gap-2 text-gray-400">
                            <DollarSign size={16} />
                            <span className="text-sm">Unlock Price</span>
                        </div>
                        <span className="text-white font-mono font-bold">0.0001 SOL</span>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-gray-400 text-sm">
                        <AlignLeft size={16} /> Caption
                    </label>
                    <textarea 
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Tell your fans about this..."
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 min-h-[80px]"
                    />
                </div>

                <button 
                    onClick={handlePostClick}
                    disabled={isUploading}
                    className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                        isUploading 
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                        : 'bg-white text-black hover:scale-[1.02]'
                    }`}
                >
                    {isUploading ? <><Loader2 className="animate-spin" /> Uploading...</> : "Post Video 🚀"}
                </button>
            </div>
        )}

        {viewState === 'uploading' && (
           <div className="w-full max-w-xs space-y-4 text-center mt-20">
               <Loader2 className="animate-spin w-12 h-12 text-purple-500 mx-auto" />
               <h2 className="text-xl font-bold">Minting...</h2>
               <p className="text-gray-500 text-sm">Saving to blockchain.</p>
           </div>
        )}
      </div>
    </div>
  );
}