"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Download, Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";

interface VideoPreviewProps {
  videoUrl: string;
  fileName: string;
  fileSize: string;
  onClose: () => void;
  onDownload: () => void;
}

const ARIA_RESET_DELAY = 1200;

export default function VideoPreview({
  videoUrl,
  fileName,
  fileSize,
  onClose,
  onDownload,
}: VideoPreviewProps) {
  /** ---------- State ---------- */
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [ariaAnnouncement, setAriaAnnouncement] = useState("");

  /** ---------- Refs ---------- */
  const readyCheckRef = useRef(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /** ---------- Helpers ---------- */
  const announce = useCallback((message: string) => {
    setAriaAnnouncement(message);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => setAriaAnnouncement(""),
      ARIA_RESET_DELAY
    );
  }, []);

  /** ---------- Handlers ---------- */
  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        announce("Video paused");
      } else {
        videoRef.current.play();
        announce("Video playing");
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, announce]);

  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      announce(isMuted ? "Video unmuted" : "Video muted");
    }
  }, [isMuted, announce]);

  const handleFullscreenToggle = useCallback(() => {
    if (videoRef.current) {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        } else if ((videoRef.current as any).webkitRequestFullscreen) {
          (videoRef.current as any).webkitRequestFullscreen();
        } else if ((videoRef.current as any).msRequestFullscreen) {
          (videoRef.current as any).msRequestFullscreen();
        }
        announce("Video entered fullscreen");
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
        announce("Video exited fullscreen");
      }
      setIsFullscreen(!isFullscreen);
    }
  }, [isFullscreen, announce]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = parseFloat(e.target.value);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  /** Prevent click bubbling to modal overlay */
  const handleContainerClick = (e: React.MouseEvent) => e.stopPropagation();

  /** ---------- Lifecycle: Ensure DOM is ready ---------- */
  useEffect(() => {
    function checkReady() {
      if (document.readyState === "complete" && !readyCheckRef.current) {
        setIsReady(true);
        readyCheckRef.current = true;
      } else if (!readyCheckRef.current) {
        timeoutRef.current = setTimeout(checkReady, 30);
      }
    }
    checkReady();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  /** ---------- Lifecycle: Keyboard handling & Focus trap ---------- */
  useEffect(() => {
    if (!isReady) return;
    announce(`Video preview opened for ${fileName}`);
    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        handlePlayPause();
      }
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        handleMuteToggle();
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleFullscreenToggle();
      }
      if (e.key === "Tab") {
        const focusable = [
          closeButtonRef.current,
          playButtonRef.current,
        ].filter(Boolean) as HTMLElement[];
        if (focusable.length === 0) return;

        const active = document.activeElement;
        if (e.shiftKey && active === focusable[0]) {
          e.preventDefault();
          focusable[focusable.length - 1]?.focus();
        } else if (!e.shiftKey && active === focusable[focusable.length - 1]) {
          e.preventDefault();
          focusable[0]?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
      announce(`Video preview closed for ${fileName}`);
    };
  }, [onClose, isReady, fileName, announce, handlePlayPause, handleMuteToggle, handleFullscreenToggle]);

  if (!isReady) return null;

  return (
    <div
      className="image-preview-fullscreen bg-black/80 flex flex-col items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-preview-title"
      tabIndex={-1}
    >
      {/* Live region for screen readers */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {ariaAnnouncement}
      </div>

      {/* Header */}
      <div
        className="w-full flex items-center justify-between text-white mb-2 px-4"
        onClick={handleContainerClick}
      >
        <h3
          id="video-preview-title"
          className="text-sm truncate max-w-[300px] sm:max-w-md"
        >
          {fileName} <span className="text-gray-400">({fileSize})</span>
        </h3>
        <button
          ref={closeButtonRef}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 hover:bg-white/20 rounded-full"
          aria-label="Close preview"
        >
          <X size={20} />
        </button>
      </div>

      {/* Video */}
      <div
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden px-4"
        style={{ minHeight: 0, flex: '1 1 auto' }}
        onClick={handleContainerClick}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-h-full max-w-full object-contain transition-transform duration-200"
          style={{ 
            maxHeight: 'calc(100vh - 200px)',
            maxWidth: 'calc(100vw - 32px)'
          }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          controls={false}
          preload="metadata"
        />
      </div>

      {/* Video Controls */}
      <div
        className="w-full flex flex-col items-center justify-center gap-2 mt-2 text-white px-4"
        onClick={handleContainerClick}
      >
        {/* Progress Bar */}
        <div className="w-full max-w-2xl">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #4b5563 ${(currentTime / (duration || 1)) * 100}%, #4b5563 100%)`
            }}
          />
          <div className="flex justify-between text-xs mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-2">
          <button
            ref={playButtonRef}
            onClick={handlePlayPause}
            className="p-2 hover:bg-white/20 rounded-full"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <button
            onClick={handleMuteToggle}
            className="p-2 hover:bg-white/20 rounded-full"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          
          <button
            onClick={handleFullscreenToggle}
            className="p-2 hover:bg-white/20 rounded-full"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <Maximize2 size={20} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="p-2 hover:bg-white/20 rounded-full"
            aria-label="Download video"
          >
            <Download size={20} />
          </button>
        </div>
      </div>
    </div>
  );
} 