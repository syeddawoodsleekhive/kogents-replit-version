/**
 * Fallback Thumbnail Component
 * Provides consistent file tiles with format badges for non-previewable images
 */

"use client";
import { useState, useEffect, useMemo } from "react";
import { Download, ExternalLink, AlertTriangle, Info } from "lucide-react";
import {
  getFormatDisplayName,
  getFormatIcon,
  needsConversionWarning,
  type ModernFormatInfo,
} from "@/utils/modern-format-utils";
import { formatFileSize } from "@/utils/advanced-image-compression";

interface FallbackThumbnailProps {
  file: AttachmentType;
  formatInfo?: ModernFormatInfo;
  isUserMessage: boolean;
  onDownload?: () => void;
  onConversionSuggest?: () => void;
  className?: string;
}

export default function FallbackThumbnail({
  file,
  formatInfo,
  isUserMessage,
  onDownload,
  onConversionSuggest,
  className = "",
}: FallbackThumbnailProps) {
  /** ------------------ State ------------------ */
  const [showDetails, setShowDetails] = useState(false);
  const [conversionAttempted, setConversionAttempted] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  /** ------------------ Derived values ------------------ */
  const fileSize = useMemo(() => formatFileSize(file.size), [file.size]);
  const formatName = useMemo(() => {
    if (formatInfo?.format) {
      return getFormatDisplayName(formatInfo.format);
    }
    // Extract format from MIME type or file extension
    if (file.mimeType.includes("/")) {
      return file.mimeType.split("/")[1].toUpperCase();
    }
    const extension = file.fileName.split(".").pop()?.toUpperCase();
    return extension || "FILE";
  }, [formatInfo, file.mimeType, file.fileName]);

  const needsWarning = useMemo(() => {
    return formatInfo ? needsConversionWarning(formatInfo) : false;
  }, [formatInfo]);

  const formatIcon = useMemo(() => {
    if (formatInfo?.format) {
      return getFormatIcon(formatInfo.format);
    }
    return "🖼️";
  }, [formatInfo]);

  /** ------------------ Effects ------------------ */
  // Attempt to create thumbnail if browser supports the format
  useEffect(() => {
    if (formatInfo?.browserSupported && !conversionAttempted) {
      attemptThumbnailGeneration();
    }
  }, [formatInfo, conversionAttempted]);

  /** ------------------ Handlers ------------------ */
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.fileName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleConversionSuggest = () => {
    if (onConversionSuggest) {
      onConversionSuggest();
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  /** ------------------ Thumbnail Generation ------------------ */
  const attemptThumbnailGeneration = async () => {
    setConversionAttempted(true);

    try {
      // Create a temporary image element to test if browser can decode
      const img = new Image();
      img.crossOrigin = "anonymous";

      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Cannot decode image"));

        // Set timeout for loading
        setTimeout(() => reject(new Error("Timeout")), 5000);
      });

      img.src = file.url;
      await loadPromise;

      // If successful, create thumbnail
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Set thumbnail size
        const maxSize = 120;
        const aspectRatio = img.width / img.height;

        if (aspectRatio > 1) {
          canvas.width = maxSize;
          canvas.height = maxSize / aspectRatio;
        } else {
          canvas.width = maxSize * aspectRatio;
          canvas.height = maxSize;
        }

        // Draw thumbnail
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to blob URL
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const thumbnailUrl = URL.createObjectURL(blob);
              setThumbnailUrl(thumbnailUrl);
            }
          },
          "image/jpeg",
          0.8
        );
      }
    } catch (error) {
      // Thumbnail generation failed - keep fallback
      console.debug("Thumbnail generation failed for", file.fileName, error);
    }
  };

  /** ------------------ Cleanup ------------------ */
  useEffect(() => {
    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [thumbnailUrl]);

  /** ------------------ Render ------------------ */
  return (
    <div className={`mt-2 mb-1 ${className}`}>
      <div
        className={`relative rounded-lg border transition-all duration-200 ${
          isUserMessage
            ? "bg-blue-500 text-white border-blue-400"
            : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
        } ${needsWarning ? "border-orange-300" : ""}`}
        role="region"
        aria-label={`${formatName} file attachment ${file.fileName}`}
      >
        {/* Warning indicator */}
        {needsWarning && (
          <div className="absolute -top-1 -right-1 z-10">
            <div className="bg-orange-500 text-white rounded-full p-1">
              <AlertTriangle size={12} />
            </div>
          </div>
        )}

        <div className="p-3">
          {/* Header with format badge and actions */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Format badge */}
              <div
                className={`px-2 py-1 rounded text-xs font-medium ${
                  isUserMessage
                    ? "bg-blue-400 text-white"
                    : needsWarning
                    ? "bg-orange-100 text-orange-800"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                <span className="mr-1">{formatIcon}</span>
                {formatName}
              </div>

              {/* Browser support indicator */}
              {formatInfo && (
                <div
                  className={`text-xs px-2 py-1 rounded ${
                    formatInfo.browserSupported
                      ? isUserMessage
                        ? "bg-green-400 text-white"
                        : "bg-green-100 text-green-800"
                      : isUserMessage
                      ? "bg-orange-400 text-white"
                      : "bg-orange-100 text-orange-800"
                  }`}
                  title={formatInfo.compatibilityMessage}
                >
                  {formatInfo.browserSupported
                    ? "Supported"
                    : "Limited Support"}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-1">
              <button
                onClick={toggleDetails}
                className={`p-1 rounded transition-colors ${
                  isUserMessage
                    ? "text-white hover:bg-blue-400"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                aria-label="Show file details"
                title="File details"
              >
                <Info size={14} />
              </button>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-1 rounded transition-colors ${
                  isUserMessage
                    ? "text-white hover:bg-blue-400"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                aria-label={`Open ${file.fileName} in new tab`}
                title="Open file"
              >
                <ExternalLink size={14} />
              </a>
              <button
                onClick={handleDownload}
                className={`p-1 rounded transition-colors ${
                  isUserMessage
                    ? "text-white hover:bg-blue-400"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                aria-label={`Download ${file.fileName}`}
                title="Download file"
              >
                <Download size={14} />
              </button>
            </div>
          </div>

          {/* Thumbnail area */}
          <div className="flex items-center gap-3">
            {/* Thumbnail or fallback icon */}
            <div
              className={`flex-shrink-0 w-16 h-16 rounded-md flex items-center justify-center ${
                isUserMessage ? "bg-blue-400" : "bg-gray-200"
              }`}
            >
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl || "/placeholder.svg"}
                  alt={`Thumbnail of ${file.fileName}`}
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <div className="text-2xl">{formatIcon}</div>
              )}
            </div>

            {/* File info */}
            <div className="flex-grow min-w-0">
              <div
                className="text-sm font-medium truncate"
                title={file.fileName}
              >
                {file.fileName}
              </div>
              <div
                className={`text-xs mt-1 ${
                  isUserMessage ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {fileSize}
              </div>

              {/* Compatibility message */}
              {formatInfo && (
                <div
                  className={`text-xs mt-1 ${
                    isUserMessage ? "text-blue-100" : "text-gray-600"
                  }`}
                >
                  {formatInfo.canPreview
                    ? "Can preview"
                    : "Preview not available"}
                </div>
              )}
            </div>
          </div>

          {/* Expanded details */}
          {showDetails && (
            <div
              className={`mt-3 pt-3 border-t ${
                isUserMessage ? "border-blue-400" : "border-gray-200"
              }`}
            >
              <div
                className={`text-xs space-y-1 ${
                  isUserMessage ? "text-blue-100" : "text-gray-600"
                }`}
              >
                <div>
                  <strong>Format:</strong>{" "}
                  {formatInfo?.compatibilityMessage || "Standard image format"}
                </div>
                {formatInfo?.conversionMessage && (
                  <div>
                    <strong>Recommendation:</strong>{" "}
                    {formatInfo.conversionMessage}
                  </div>
                )}
                {formatInfo?.needsConversion && onConversionSuggest && (
                  <button
                    onClick={handleConversionSuggest}
                    className={`mt-2 px-3 py-1 rounded text-xs font-medium transition-colors ${
                      isUserMessage
                        ? "bg-white text-blue-600 hover:bg-blue-50"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Suggest Conversion to{" "}
                    {formatInfo.suggestedFormat?.toUpperCase()}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
