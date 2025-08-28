"use client";

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  ImageIcon,
  Maximize2,
  Play,
} from "lucide-react";
import { createPortal } from "react-dom";
import ImagePreview from "./image-preview";
import VideoPreview from "./video-preview";
import { formatFileSize } from "@/utils/advanced-image-compression";
import { accessManagedUrl } from "@/utils/object-url-manager";
import {
  detectModernFormat,
  FormatCompatibilityResult,
} from "@/utils/modern-format-utils";
import FallbackThumbnail from "./fallback-thumbnail";
import { validateFiles, DEFAULT_FILE_RESTRICTIONS } from "@/utils/file-rules";

interface FileAttachmentProps {
  file: AttachmentType;
  isUserMessage: boolean;
  isEncrypted?: boolean;
  encryptionVerified?: boolean;
}

const FileAttachment = memo(function FileAttachment({
  file,
  isUserMessage,
  isEncrypted = false,
  encryptionVerified = true,
}: FileAttachmentProps) {
  /** ------------------ State ------------------ */
  const [showPreview, setShowPreview] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [formatCompatibility, setFormatCompatibility] =
    useState<FormatCompatibilityResult | null>(null);

  /** ------------------ Refs ------------------ */
  const readyCheckRef = useRef(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /** ------------------ Derived values ------------------ */
  const fileTypeInfo = useMemo(
    () => ({
      isImage: file.mimeType.startsWith("image/"),
      isVideo: file.mimeType.startsWith("video/"),
      isPDF: file.mimeType === "application/pdf",
      isDocument:
        file.mimeType.includes("word") ||
        file.mimeType.includes("document") ||
        file.mimeType.includes("sheet") ||
        file.mimeType.includes("text"),
    }),
    [file.mimeType]
  );

  const { isImage, isVideo, isPDF, isDocument } = fileTypeInfo;

  const fileSize = useMemo(() => formatFileSize(file.size), [file.size]);

  const shouldUseFallback = useMemo(() => {
    if (!isImage) return false;
    if (!formatCompatibility) return false;
    return (
      formatCompatibility.formatInfo.isModernFormat &&
      !formatCompatibility.formatInfo.canPreview
    );
  }, [isImage, formatCompatibility]);

  /** ------------------ Memoized Handlers ------------------ */
  // const handleDownload = () => {
  //   setAriaAnnouncement(`Downloading file ${file.name}`);
  //   const link = document.createElement("a");
  //   link.href = file.url;
  //   link.download = file.name;
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  //   timeoutRef.current = setTimeout(
  //     () => setAriaAnnouncement(`File ${file.name} download started`),
  //     100
  //   );
  // };

  const getPreviewUrl = useCallback(() => {
    // Priority: previewUrl > url > fallback
    if (file.previewUrl) {
      return file.previewUrl;
    }
    if (file.url) {
      return file.url;
    }
    return "/placeholder.svg";
  }, [file.previewUrl, file.url]);

  // Enhanced URL for actions (download, external link)
  const getActionUrl = useCallback(() => {
    // For base64 images, we might want to create a blob URL for download
    if (file.isBase64 && file.url.startsWith("data:")) {
      return file.url; // Use base64 for now, could create blob URL if needed
    }
    return file.url;
  }, [file.isBase64, file.url]);

  const handleDownload = useCallback(() => {
    setAriaAnnouncement(`Downloading file ${file.fileName}`);
    try {
      const link = document.createElement("a");

      if (file.isBase64 && file.url.startsWith("data:")) {
        // For base64, create a blob URL for download
        const response = fetch(file.url);
        response
          .then((res) => res.blob())
          .then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            link.href = blobUrl;
            link.download = file.fileName;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl); // Clean up blob URL

            timeoutRef.current = setTimeout(
              () =>
                setAriaAnnouncement(`File ${file.fileName} download started`),
              100
            );
          })
          .catch((error) => {
            console.error("Failed to create blob for download:", error);
            setAriaAnnouncement(`Failed to download ${file.fileName}`);
          });
      } else {
        // Regular URL download
        link.href = getActionUrl();
        link.download = file.fileName;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        timeoutRef.current = setTimeout(
          () => setAriaAnnouncement(`File ${file.fileName} download started`),
          100
        );
      }
    } catch (error) {
      console.error("Download failed:", error);
      setAriaAnnouncement(`Failed to download ${file.fileName}`);
    }
  }, [file.fileName, file.isBase64, file.url, getActionUrl]);

  const openPreview = useCallback(() => {
    if (previewUrl) {
      accessManagedUrl(previewUrl); // Track access
      setShowPreview(true);
    }
  }, [previewUrl]);

  const closePreview = useCallback(() => setShowPreview(false), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (
        (e.key === "Enter" || e.key === " ") &&
        (isImage || isVideo) &&
        !showPreview &&
        previewUrl
      ) {
        e.preventDefault();
        openPreview();
      }
    },
    [isImage, isVideo, showPreview, previewUrl, openPreview]
  );

  const handleConversionSuggest = useCallback(() => {
    if (formatCompatibility?.formatInfo.suggestedFormat) {
      setAriaAnnouncement(
        `Consider converting ${
          file.fileName
        } to ${formatCompatibility.formatInfo.suggestedFormat.toUpperCase()} for better compatibility`
      );
    }
  }, [formatCompatibility?.formatInfo.suggestedFormat, file.fileName]);

  const handleExternalLinkClick = useCallback(() => {
    setAriaAnnouncement(`Opening file ${file.fileName} in new tab`);

    if (file.isBase64 && file.url.startsWith("data:")) {
      // For base64, open in new tab (browser will handle data URL)
      window.open(file.url, "_blank", "noopener,noreferrer");
    } else {
      // Regular URL
      window.open(getActionUrl(), "_blank", "noopener,noreferrer");
    }
  }, [file.fileName, file.isBase64, file.url, getActionUrl]);

  /** ------------------ Effects ------------------ */
  // Wait for DOM to be fully ready
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

  useEffect(() => {
    if (isImage) {
      detectModernFormat(new File([], file.fileName, { type: file.mimeType }))
        .then(setFormatCompatibility)
        .catch(() => setFormatCompatibility(null));
    }
  }, [isImage, file.mimeType, file.fileName]);

  // Create managed URL for preview
  useEffect(() => {
    if (file.url && (isImage || isVideo) && !shouldUseFallback) {
      // If it's already a blob URL, use it directly
      if (file.url.startsWith("blob:") || file.url.startsWith("data:")) {
        setPreviewUrl(file.url);
        accessManagedUrl(file.url); // Track access
      } else if (file.isBase64 && file.url.startsWith("data:")) {
        // Handle base64 data URLs
        setPreviewUrl(file.url);
        // Don't track base64 URLs as they're already in memory
      } else {
        // For regular URLs, use them directly
        setPreviewUrl(file.url);
      }
    }
  }, [file.url, file.isBase64, isImage, isVideo, shouldUseFallback]);

  // Announce when preview opens/closes
  useEffect(() => {
    if (isImage || isVideo) {
      const mediaType = isImage ? "Image" : "Video";
      setAriaAnnouncement(
        showPreview
          ? `${mediaType} preview opened for ${file.fileName}`
          : `${mediaType} preview closed for ${file.fileName}`
      );
      if (!showPreview && previewButtonRef.current)
        previewButtonRef.current.focus();
    }
  }, [showPreview, isImage, isVideo, file.fileName]);

  // Simulate upload status (if needed)
  // useEffect(() => {
  //   if (uploadStatus === "idle") {
  //     setAriaAnnouncement(`Uploading file ${file.name}`);
  //     const steps = [
  //       {
  //         status: "uploading",
  //         msg: `File ${file.name} is uploading`,
  //         delay: 500,
  //       },
  //       {
  //         status: "completed",
  //         msg: `File ${file.name} uploaded successfully`,
  //         delay: 1500,
  //       },
  //     ];
  //     let stepIndex = 0;

  //     function processStep() {
  //       if (stepIndex >= steps.length) return;
  //       const step = steps[stepIndex];
  //       setUploadStatus(step.status as any);
  //       setAriaAnnouncement(step.msg);
  //       stepIndex++;
  //       timeoutRef.current = setTimeout(
  //         processStep,
  //         steps[stepIndex]?.delay ?? 0
  //       );
  //     }

  //     processStep();
  //   }

  //   return () => {
  //     if (timeoutRef.current) {
  //       clearTimeout(timeoutRef.current);
  //       timeoutRef.current = null;
  //     }
  //   };
  // }, [uploadStatus, file.name]);

  /** ------------------ Helper: Get File Icon ------------------ */
  const fileIcon = useMemo(() => {
    const iconProps = {
      size: 24,
      color: isUserMessage ? "white" : "currentColor",
    };

    if (isPDF) {
      return <FileText {...iconProps} className="text-red-600" />;
    }
    if (isDocument) {
      return <FileText {...iconProps} className="text-blue-600" />;
    }
    if (isImage) {
      return <ImageIcon {...iconProps} className="text-green-600" />;
    }
    if (isVideo) {
      return <Play {...iconProps} className="text-purple-600" />;
    }

    return <FileText {...iconProps} />;
  }, [isPDF, isDocument, isImage, isVideo, isUserMessage]);

  const containerClasses = useMemo(() => {
    return `flex items-center p-3 rounded-lg border transition-colors w-full ${
      isUserMessage
        ? "bg-blue-500 text-white border-blue-400"
        : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
    }`;
  }, [isUserMessage]);

  const buttonClasses = useMemo(() => {
    return `p-2 rounded-full transition-colors ${
      isUserMessage
        ? "text-white hover:bg-blue-400"
        : "text-gray-600 hover:bg-gray-200"
    }`;
  }, [isUserMessage]);

  /** ------------------ Conditional Rendering ------------------ */
  if (!isReady) return null;

  return (
    <>
      {/* Screen-reader live region */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {ariaAnnouncement}
      </div>

      {/* File container */}
      <div className="">
        {shouldUseFallback ? (
          <FallbackThumbnail
            file={file}
            formatInfo={formatCompatibility?.formatInfo}
            isUserMessage={isUserMessage}
            onDownload={handleDownload}
            onConversionSuggest={handleConversionSuggest}
          />
        ) : (isImage || isVideo) && previewUrl ? (
          /** ------------------ Media File (Image/Video) ------------------ */
          <div
            className="relative group w-full"
            role="region"
            aria-label={`${isImage ? "Image" : "Video"} attachment ${
              file.fileName
            }`}
          >
            <div
              className="overflow-hidden rounded-md cursor-pointer hover:opacity-90 transition-opacity"
              onClick={openPreview}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              role="button"
              aria-label={`View ${isImage ? "image" : "video"} ${
                file.fileName
              }`}
            >
              {isImage ? (
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt={file.fileName}
                  className="w-full rounded-md object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="relative w-full">
                  <video
                    src={previewUrl}
                    className="w-full rounded-md object-contain"
                    preload="metadata"
                    muted
                  />
                  {/* Video play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 rounded-full p-3">
                      <Play size={32} className="text-white ml-1" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Hover actions */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-md">
              <div className="flex gap-2">
                <button
                  onClick={handleExternalLinkClick}
                  className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 shadow-lg"
                  aria-label={`Open file ${file.fileName} in new tab`}
                  title="Open file"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 shadow-lg"
                  aria-label={`Download ${isImage ? "image" : "video"} ${
                    file.fileName
                  }`}
                  title={`Download ${isImage ? "image" : "video"}`}
                >
                  <Download size={16} />
                </button>
              </div>
            </div>

            {/* File size badge - now shows on hover */}
            <div className="absolute bottom-2 left-2 text-[9px] px-1 py-1 rounded bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
              {fileSize}
            </div>

            {/* Preview Modal - Rendered via Portal */}
            {showPreview &&
              typeof document !== "undefined" &&
              createPortal(
                isImage ? (
                  <ImagePreview
                    imageUrl={previewUrl}
                    fileName={file.fileName}
                    fileSize={fileSize}
                    onClose={closePreview}
                    onDownload={handleDownload}
                  />
                ) : (
                  <VideoPreview
                    videoUrl={previewUrl}
                    fileName={file.fileName}
                    fileSize={fileSize}
                    onClose={closePreview}
                    onDownload={handleDownload}
                  />
                ),
                document.body
              )}
          </div>
        ) : (
          /** ------------------ Non-Media File ------------------ */
          <div
            className={containerClasses}
            role="region"
            aria-label={`File attachment ${file.fileName}`}
          >
            <div className="mr-3 flex-shrink-0">{fileIcon}</div>

            <div className="overflow-hidden flex-grow min-w-0">
              <div
                className="text-sm font-medium truncate"
                title={file.fileName}
              >
                {file.fileName}
              </div>
              <div
                className={`text-xs ${
                  isUserMessage ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {fileSize}
              </div>
            </div>

            <div className="flex ml-3 gap-1 flex-shrink-0">
              <button
                onClick={handleExternalLinkClick}
                className={buttonClasses}
                aria-label={`Open file ${file.fileName} in new tab`}
                title="Open file"
              >
                <ExternalLink size={16} />
              </button>
              <button
                onClick={handleDownload}
                className={buttonClasses}
                aria-label={`Download file ${file.fileName}`}
                title="Download file"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
});

export default FileAttachment;
