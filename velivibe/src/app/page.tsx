"use client";
import React, { useState, useEffect } from "react";
import UploadVideo from "@/src/components/UploadVideo";
import VideoFeed from "@/src/components/VideoFeed"; // Ensure filename matches (videofeed vs VideoFeed)
import CreatorDashboard from "@/src/components/CreatorDashboard";
import { Home as HomeIcon, PlusSquare, User, Loader2 } from "lucide-react";
import { fetchVideosFromDB, supabase } from "@/src/utils/supabase"; 
import { Video } from "@/src/types/index";

export default function Home() {
  const [view, setView] = useState("feed");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  
  // NEW: State to track which video to jump to from Dashboard
  const [startVideo, setStartVideo] = useState<Video | null>(null);

  const loadFeed = async () => {
      try {
          const vids = await fetchVideosFromDB(); 
          setAllVideos(vids);
      } catch (e) {
          console.error("DB Error", e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    setMounted(true);
    loadFeed();

    // Real-time updates for new videos
    const channel = supabase
      .channel('public:videos')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'videos' }, (payload) => {
          setAllVideos((prev) => [
              { 
                  id: payload.new.id, 
                  url: payload.new.video_url, 
                  creator: payload.new.owner_wallet, 
                  title: payload.new.caption,
                  isPremium: payload.new.is_premium,
                  price: payload.new.price_sol
              }, 
              ...prev
          ]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // NEW: Handler for clicking a video in CreatorDashboard
  const handleVideoSelect = (video: Video) => {
      console.log("Jumping to video:", video.id);
      setStartVideo(video); // 1. Set the target video
      setView("feed");      // 2. Switch back to feed view immediately
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-gray-900 flex justify-center items-center">
      <div className="w-full max-w-[450px] h-[100dvh] bg-black relative shadow-2xl flex flex-col overflow-hidden">
        
        {/* MAIN CONTENT AREA */}
        <div className="flex-1 relative overflow-hidden">
            {loading ? (
                <div className="h-full flex items-center justify-center text-purple-500"><Loader2 className="animate-spin"/></div>
            ) : (
                <>
                    {view === "feed" && (
                        <VideoFeed 
                            videos={allVideos} 
                            startVideo={startVideo} // <--- PASSING THE JUMP TARGET
                        />
                    )}
                    
                    {view === "upload" && (
                        <div className="h-full w-full overflow-y-auto no-scrollbar">
                            <UploadVideo 
                                onUploadSuccess={() => { setView("feed"); }} 
                                onBack={() => setView("feed")} 
                            />
                        </div>
                    )}
                    
                    {view === "dashboard" && (
                        <div className="h-full w-full overflow-y-auto no-scrollbar">
                            <CreatorDashboard 
                                onBack={() => setView("feed")} 
                                onVideoSelect={handleVideoSelect} // <--- PASSING THE HANDLER
                            />
                        </div>
                    )}
                </>
            )}
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <div className="bg-black border-t border-gray-800 p-4 flex justify-between items-center z-50 pb-6 shrink-0">
            
            <button onClick={() => setView("feed")} className={`flex flex-col items-center ${view === "feed" ? "text-white" : "text-gray-600"}`}>
                <HomeIcon size={24} />
                <span className="text-[10px] mt-1">Feed</span>
            </button>
            
            <button onClick={() => setView("upload")} className="-mt-10">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl shadow-lg border-4 border-black text-white hover:scale-105 transition">
                    <PlusSquare size={28} fill="white" className="text-purple-600" />
                </div>
            </button>
            
            <button onClick={() => setView("dashboard")} className={`flex flex-col items-center ${view === "dashboard" ? "text-white" : "text-gray-600"}`}>
                <User size={24} />
                <span className="text-[10px] mt-1">Earn</span>
            </button>

        </div>

      </div>
    </main>
  );
}