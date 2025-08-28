"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ImagePreviewProps {
  imageUrl: string;
  fileName: string;
  fileSize: string;
  onClose: () => void;
  onDownload: () => void;
}

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ARIA_RESET_DELAY = 1200;

export default function ImagePreview({
  imageUrl,
  fileName,
  fileSize,
  onClose,
  onDownload,
}: ImagePreviewProps) {
  /** ---------- State ---------- */
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [ariaAnnouncement, setAriaAnnouncement] = useState("");

  /** ---------- Refs ---------- */
  const readyCheckRef = useRef(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const firstControlRef = useRef<HTMLButtonElement>(null);
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
  const handleZoomIn = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setZoom((prev) => {
        const newZoom = Math.min(prev + ZOOM_STEP, ZOOM_MAX);
        announce(`Zoomed in to ${newZoom * 100}%`);
        return newZoom;
      });
    },
    [announce]
  );

  const handleZoomOut = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setZoom((prev) => {
        const newZoom = Math.max(prev - ZOOM_STEP, ZOOM_MIN);
        announce(`Zoomed out to ${newZoom * 100}%`);
        return newZoom;
      });
    },
    [announce]
  );

  const handleRotate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setRotation((prev) => {
        const newRotation = (prev + 90) % 360;
        announce(`Rotated image to ${newRotation} degrees`);
        return newRotation;
      });
    },
    [announce]
  );

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
    announce(`Image preview opened for ${fileName}`);
    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const focusable = [
          closeButtonRef.current,
          firstControlRef.current,
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
      announce(`Image preview closed for ${fileName}`);
    };
  }, [onClose, isReady, fileName, announce]);

  if (!isReady) return null;

  return (
    <div
      className="image-preview-fullscreen bg-black/80 flex flex-col items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-preview-title"
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
          id="image-preview-title"
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

      {/* Image */}
      <div
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden px-4"
        style={{ minHeight: 0, flex: "1 1 auto" }}
        onClick={handleContainerClick}
      >
        {/* <img
          src={imageUrl || "/placeholder.svg"}
          alt={`${fileName}, ${fileSize}`}
          className="max-h-full max-w-full object-contain transition-transform duration-200"
          style={{ 
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            maxHeight: 'calc(100vh - 200px)',
            maxWidth: 'calc(100vw - 32px)'
          }}
        /> */}
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={fileName}
          className="max-h-full max-w-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
        />
      </div>

      {/* Controls */}
      <div
        className="w-full flex items-center justify-center gap-2 mt-2 text-white px-4"
        onClick={handleContainerClick}
      >
        <button
          ref={firstControlRef}
          onClick={handleZoomOut}
          className="p-2 hover:bg-white/20 rounded-full"
          aria-label="Zoom out"
          disabled={zoom <= ZOOM_MIN}
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-white/20 rounded-full"
          aria-label="Zoom in"
          disabled={zoom >= ZOOM_MAX}
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={handleRotate}
          className="p-2 hover:bg-white/20 rounded-full"
          aria-label="Rotate image"
        >
          <RotateCw size={20} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="p-2 hover:bg-white/20 rounded-full"
          aria-label="Download image"
        >
          <Download size={20} />
        </button>
      </div>
    </div>
  );
}
