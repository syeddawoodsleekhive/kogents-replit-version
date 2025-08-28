"use client";

import React, { useEffect, useMemo } from "react";
import { X, FileText, ImageIcon, Play, Video } from "lucide-react";
import { formatFileSize } from "@/utils/advanced-image-compression";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export default function FilePreview({ file, onRemove }: FilePreviewProps) {
  /** ------------------ Derived values ------------------ */
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isPDF = file.type === "application/pdf";
  const isDocument = file.type.includes("word") || file.type.includes("document") || file.type.includes("sheet") || file.type.includes("text");
  const fileSize = formatFileSize(file.size);

  /** ------------------ Preview URL (memoized) ------------------ */
  const previewUrl = useMemo(
    () => (isImage ? URL.createObjectURL(file) : null),
    [file, isImage]
  );

  /** ------------------ Cleanup preview URL on unmount ------------------ */
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  /** ------------------ Render helper: File Icon ------------------ */
  const getFileIcon = () => {
    const baseClasses = "w-8 h-8 rounded flex items-center justify-center text-xs font-semibold";

    if (isPDF) {
      return (
        <div className={`${baseClasses} bg-red-100 text-red-700`}>
          <FileText size={16} />
        </div>
      );
    }
    if (isDocument) {
      return (
        <div className={`${baseClasses} bg-blue-100 text-blue-700`}>
          <FileText size={16} />
        </div>
      );
    }
    if (isVideo) {
      return (
        <div className={`${baseClasses} bg-purple-100 text-purple-700`}>
          <Video size={16} />
        </div>
      );
    }
    if (isImage) {
      return (
        <div className={`${baseClasses} bg-green-100 text-green-700`}>
          <ImageIcon size={16} />
        </div>
      );
    }
    return (
      <div className={`${baseClasses} bg-gray-100 text-gray-700`}>
        <FileText size={16} />
      </div>
    );
  };

  return (
    <div className="relative group bg-gray-50 rounded border border-gray-200 overflow-hidden">
      {isImage ? (
        /** ------------------ Image Preview ------------------ */
        <div className="w-16 h-16 relative">
          <img
            src={previewUrl || ""}
            alt={file.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] px-1 truncate">
            {fileSize}
          </div>
        </div>
      ) : isVideo ? (
        /** ------------------ Video Preview ------------------ */
        <div className="w-16 h-16 relative">
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Play size={24} className="text-gray-600" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] px-1 truncate">
            {fileSize}
          </div>
        </div>
      ) : (
        /** ------------------ Non-Media Preview ------------------ */
        <div className="w-16 h-16 p-1 flex flex-col items-center justify-center">
          {getFileIcon()}
          <div className="text-[8px] text-gray-500 mt-1 text-center truncate w-full px-1">
            {fileSize}
          </div>
        </div>
      )}

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-0 right-0 bg-black/50 text-white rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Remove ${file.name}`}
      >
        <X size={12} />
      </button>
    </div>
  );
}
