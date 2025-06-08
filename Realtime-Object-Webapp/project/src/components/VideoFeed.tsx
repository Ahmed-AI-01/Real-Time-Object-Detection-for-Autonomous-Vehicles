import React, { useState, useEffect, useRef } from 'react';
import { Loader, Pause, Play, AlertCircle } from 'lucide-react';

interface VideoFeedProps {
  darkMode: boolean;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ darkMode }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    const videoFeed = document.getElementById('video-feed') as HTMLImageElement;
    if (videoFeed) {
      videoFeed.onload = () => {
        setLoading(false);
        setError(false);
        frameCountRef.current++;
        
        // Calculate FPS every second
        const now = Date.now();
        const elapsed = now - lastTimeRef.current;
        if (elapsed >= 1000) {
          frameCountRef.current = 0;
          lastTimeRef.current = now;
        }
      };
      videoFeed.onerror = () => {
        setLoading(false);
        setError(true);
      };
    }

    return () => {
      if (videoFeed) {
        videoFeed.onload = null;
        videoFeed.onerror = null;
      }
    };
  }, []);

  const togglePause = () => {
    setIsPaused(!isPaused);
    const videoFeed = document.getElementById('video-feed') as HTMLImageElement;
    if (videoFeed) {
      videoFeed.src = isPaused ? '/api/video' : '';
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'} shadow-lg mb-6 transition-colors duration-300`}>
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></span>
          Live KITTI Detection Feed
        </h2>
        <div className="flex gap-2">
          <button
            onClick={togglePause}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>
        </div>
      </div>

      <div className="aspect-video relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-10">
            <Loader className="animate-spin text-emerald-500" size={48} />
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900 bg-opacity-10 text-center p-6">
            <p className="text-xl font-bold text-red-500 mb-2">Connection Error</p>
            <p className="text-gray-400">Unable to connect to KITTI detection stream</p>
            <p className="text-gray-400 text-sm mt-4">Please ensure the detection server is running</p>
          </div>
        ) : (
          <img 
            id="video-feed" 
            src={isPaused ? '' : 'http://localhost:8000/video'} 
            alt="Real-time KITTI detection stream" 
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </div>
  );
};

export default VideoFeed;