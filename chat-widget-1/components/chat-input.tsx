"use client";

import {
  Ellipsis,
  Paperclip,
  Send,
  Smile,
  X,
  Upload,
  AlertCircle,
  Camera,
} from "lucide-react";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import EmojiPicker from "./emoji-picker";

import { useCompressionWorker } from "@/hooks/use-compression-worker";
import { useDynamicBatchSize } from "@/hooks/use-dynamic-batch-size";
import { useNetworkQuality } from "@/hooks/use-network-quality";

import { useWidgetContext } from "@/context/widgetContext";
import { messageEncryptionManager } from "@/utils/message-encryption";

import { cn } from "@/lib/utils";
import { validateFiles, DEFAULT_FILE_RESTRICTIONS } from "@/utils/file-rules";
import MoreOptions from "./more-options";

// New functionality imports
import { useCameraCapture } from "@/hooks/use-camera-capture";
import { useCharacterLimit } from "@/hooks/use-character-limit";
import { useDraftPersistence } from "@/hooks/use-draft-persistence";
import { handleSmartPaste, processRichText } from "@/utils/rich-text-processor";
import { formatCameraError } from "@/utils/camera-utils";
import { sniffFileType, sanitizeFilename } from "@/utils/security-utils";
import { createManagedUrl, revokeManagedUrl } from "@/utils/object-url-manager";
import {
  validateFileEnhanced,
  formatFileSize,
} from "@/utils/advanced-image-compression";
import { detectAnimatedFormatEnhanced } from "@/utils/animated-format-utils";
import { detectModernFormat } from "@/utils/modern-format-utils";
import { extractEXIFData, getOrientationInfo } from "@/utils/exif-utils";

import { useFileUpload } from "@/hooks/use-file-upload";
import { useSearchParams } from "next/navigation";
import { generateMessageId } from "@/app/api/v2/functions";
import { ComplianceIndicator } from "@/components/compliance-indicator";
import { useLanguage } from "@/context/language-context";
import { useT } from "@/lib/i18n";

type FileStatus =
  | "queued"
  | "processing"
  | "compressed"
  | "failed"
  | "skipped"
  | "oversized"
  | "unsupported"
  | "sent";
interface FileState {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
  attempts: number;
}

// New enhanced file upload state interface
interface FileUploadState {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: "pending" | "compressing" | "complete" | "error";
  progress: number;
  previewUrl?: string;
  compressedFile?: File;
  error?: string;
  animationInfo?: any;
  modernFormatInfo?: any;
  exifData?: any;
  orientationInfo?: any;
  compatibilityWarnings?: string[];
}

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  onTyping?: (isTyping: boolean) => void;
  isTagEnable: boolean;
  toggleChatOpen: boolean;
  isOpen: boolean;
  isChatBadge?: boolean;
  isPreChatForm?: boolean;
  messages: any[];
  onClick: () => void;
  sessionId?: string; // Add sessionId for file encryption
  emitSocketEvent?: (event: string, data: any) => void;
}

function fileId(f: File) {
  return `${f.name}:${f.size}:${f.lastModified}`;
}

// Back-pressure thresholds
const MAX_INFLIGHT_TASKS = 8;

export default function ChatInput({
  onSendMessage,
  onTyping,
  isTagEnable,
  toggleChatOpen,
  isOpen,
  messages,
  isChatBadge = false,
  isPreChatForm = false,
  onClick,
  emitSocketEvent,
}: ChatInputProps) {
  const t = useT();
  const { isRTL, direction } = useLanguage();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileStatesRef = useRef<Map<string, FileState>>(new Map());
  const offlineQueueRef = useRef<File[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // New state variables for enhanced functionality
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadState[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [showCameraOptions, setShowCameraOptions] = useState(false);

  const params = useSearchParams();
  const apiToken = params.get("apiToken");

  const networkInfo = useNetworkQuality();
  const {
    compressImage: compressWithWorker,
    cancelTask,
    getPendingTaskCount,
    isWorkerSupported,
  } = useCompressionWorker();
  const { batchConfig, updateMetrics, getCompressionOptions } =
    useDynamicBatchSize();

  // New hooks for enhanced functionality
  const {
    capabilities,
    isCapturing,
    error: cameraError,
    captureFromCamera,
    requestPermissions,
    clearError,
  } = useCameraCapture();

  // Draft persistence functionality
  const sessionId = `widget_${generateMessageId()}`; // In real app, get from context/props
  const { draftContent, hasDraft, saveDraft, clearDraft, isStorageAvailable } =
    useDraftPersistence({
      sessionId,
      autoSaveDelay: 2000,
      respectPrivacy: true,
    });

  // Character limit functionality
  const characterLimit = useCharacterLimit(message, {
    softLimit: 1000,
    hardLimit: 2000,
    showCounterAt: 80,
    warningAt: 90,
    errorAt: 100,
  });

  function setFileState(fs: File, partial: Partial<FileState>) {
    const id = fileId(fs);
    const prev = fileStatesRef.current.get(id) || {
      id,
      file: fs,
      status: "queued",
      attempts: 0,
    };
    const next = { ...prev, ...partial };
    fileStatesRef.current.set(id, next);
    return next;
  }
  function getFileState(fs: File) {
    return fileStatesRef.current.get(fileId(fs));
  }

  // New utility functions for enhanced file handling
  const generateFileId = () =>
    `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Function to detect and remove duplicate files
  const removeDuplicateFiles = (files: File[]): File[] => {
    const uniqueFiles: File[] = [];
    const seenFiles = new Set<string>();

    for (const file of files) {
      // Use the robust file signature for better duplicate detection
      const fileSignature = createFileSignature(file);

      // Check if this file is a duplicate within the current selection only
      if (!seenFiles.has(fileSignature)) {
        seenFiles.add(fileSignature);
        uniqueFiles.push(file);
      } else {
        console.log(
          `Duplicate file detected and removed: ${file.name} (same content as another file in current selection)`
        );
      }
    }

    return uniqueFiles;
  };

  // Function to create a more robust file signature for duplicate detection
  const createFileSignature = (file: File): string => {
    // Create a signature based on file properties that indicate content similarity
    const baseSignature = `${file.size}_${file.type}_${file.lastModified}`;

    // For images, add additional properties
    if (file.type.startsWith("image/")) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      return `${baseSignature}_${extension}`;
    }

    // For other files, use name as additional identifier
    return `${baseSignature}_${file.name.toLowerCase()}`;
  };

  // Function to encrypt file and show details (for future use)
  const encryptFileAndShowDetails = async (file: File, sessionId: string) => {
    try {
      // Convert file to base64 string for encryption
      const fileReader = new FileReader();

      fileReader.onload = async () => {
        try {
          const fileContent = fileReader.result as string;
          const base64Content = fileContent.split(",")[1]; // Remove data URL prefix

          // Encrypt the file content
          const encrypted = await messageEncryptionManager.encryptMessage(
            base64Content,
            {
              sessionId,
              preserveFormatting: false,
              compressText: true,
            }
          );

          // Show comprehensive file encryption details
          console.log(`[v0] 🔐 File Encrypted Successfully (For Future Use)`, {
            sessionId: sessionId,
            fileInfo: {
              name: file.name,
              type: file.type,
              size: file.size,
              lastModified: file.lastModified,
              extension: file.name.split(".").pop()?.toLowerCase() || "unknown",
            },
            encryptionDetails: {
              originalContentLength: base64Content.length,
              encryptedContentLength: encrypted.encryptedContent.length,
              compressionRatio:
                (
                  ((base64Content.length - encrypted.encryptedContent.length) /
                    base64Content.length) *
                  100
                ).toFixed(2) + "%",
              metadata: encrypted.metadata,
              encryptionResult: {
                keyId: encrypted.metadata.keyId,
                algorithm: encrypted.metadata.algorithm,
                iv: encrypted.metadata.iv,
                authTag: encrypted.metadata.authTag,
                timestamp: encrypted.metadata.timestamp,
                version: encrypted.metadata.version,
              },
            },
            fileCategory: file.type.startsWith("image/")
              ? "Image"
              : file.type.startsWith("video/")
              ? "Video"
              : file.type.startsWith("audio/")
              ? "Audio"
              : file.type.startsWith("application/")
              ? "Document"
              : "Other",
            securityInfo: {
              isImage: file.type.startsWith("image/"),
              isVideo: file.type.startsWith("video/"),
              isAudio: file.type.startsWith("audio/"),
              isDocument: file.type.startsWith("application/"),
              estimatedEncryptionTime:
                Date.now() - encrypted.metadata.timestamp + "ms",
            },
          });
        } catch (error) {
          console.error(`[v0] File encryption failed for ${file.name}:`, error);
        }
      };

      fileReader.onerror = () => {
        console.error(`[v0] Failed to read file ${file.name} for encryption`);
      };

      // Read file as data URL (base64)
      fileReader.readAsDataURL(file);
    } catch (error) {
      console.error(
        `[v0] File encryption process failed for ${file.name}:`,
        error
      );
    }
  };

  const { uploadFile, uploadingFiles } = useFileUpload({
    sessionId: `widget_upload_${generateMessageId()}`,
    workspaceId: apiToken?.toString() || "",
    onUploadComplete: (messageId, result) => {
      console.log("File upload completed:", messageId, result);
    },
    onUploadError: (messageId, error) => {
      console.error("File upload failed:", messageId, error);
    },
    emitSocketEvent,
  });

  const [complianceResult, setComplianceResult] = useState<{
    hasViolations: boolean;
    blockedFiles: string[];
    riskScore: number;
  } | null>(null);

  const processAndSendFiles = async (
    files: File[],
    textMessage = "",
    sessionId?: string
  ) => {
    if (!canAcceptMore()) {
      console.log("Cannot accept more files, processing already in progress");
      return;
    }

    if (isOffline) {
      offlineQueueRef.current.push(...files);
      alert(
        `You're offline. Queued ${files.length} file(s). They will be sent automatically when you're back online.`
      );
      return;
    }

    // Apply file rules validation before processing
    try {
      const validation = await validateFiles(files, DEFAULT_FILE_RESTRICTIONS);
      const validFiles = validation.fileResults
        .filter((r) => r.isValid)
        .map((r) => r.file);

      if (validation.errors.length > 0) {
        // Show errors as alerts instead of setting upload errors
        validation.errors.forEach((error) => {
          alert(`File Upload Error: ${error}`);
        });
        setUploadErrors([]);
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn(
          "File processing validation warnings:",
          validation.warnings
        );
      }

      if (validFiles.length === 0) {
        setUploadErrors(["No valid files to process"]);
        return;
      }

      // Remove duplicate files before processing
      const uniqueFiles = removeDuplicateFiles(validFiles);

      if (uniqueFiles.length === 0) {
        console.log("All files were duplicates, nothing to send");
        return;
      }

      if (uniqueFiles.length < validFiles.length) {
        const duplicateCount = validFiles.length - uniqueFiles.length;
        console.log(
          `Removed ${duplicateCount} duplicate file(s) from current selection`
        );
      }

      setProcessingFiles(true);

      try {
        console.log(
          `[ChatInput] Starting file processing for ${uniqueFiles.length} files`
        );

        // Process files with compression
        const processedFiles = await processFilesWithRetry(uniqueFiles);
        console.log(
          `[ChatInput] Files processed successfully:`,
          processedFiles.map((f) => ({
            name: f.name,
            type: f.type,
            size: f.size,
          }))
        );

        // Encrypt files and show details (for future use)
        if (sessionId) {
          console.log(
            `[ChatInput] Starting file encryption for ${processedFiles.length} files`
          );
          for (const file of processedFiles) {
            await encryptFileAndShowDetails(file, sessionId);
          }
        }

        // Send the processed files with the text message
        console.log(
          `[ChatInput] Sending ${processedFiles.length} files with message`
        );
        onSendMessage(textMessage, processedFiles);

        // Clear any errors
        setUploadErrors([]);
      } catch (error) {
        console.error("Error processing files:", error);
        setUploadErrors([
          `Failed to process files: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ]);
      } finally {
        setProcessingFiles(false);
      }
    } catch (error) {
      console.error("Error validating files for processing:", error);
      setUploadErrors(["Failed to validate files for processing"]);
    }
  };

  const handleFileSelect = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      setUploadErrors([]);

      // Apply file rules validation
      const validation = await validateFiles(
        fileArray,
        DEFAULT_FILE_RESTRICTIONS
      );

      // Filter valid files based on validation results
      const validFiles = validation.fileResults
        .filter((r) => r.isValid)
        .map((r) => r.file);

      const errors = validation.errors;
      const warnings = validation.warnings;

      // Handle validation errors and warnings
      if (errors.length > 0) {
        errors.forEach((error) => {
          console.error(`File Upload Error: ${error}`);
        });
        setUploadErrors([]);
      }

      if (warnings.length > 0) {
        console.warn("File validation warnings:", warnings);
      }

      if (validFiles.length === 0) {
        setUploadErrors(["No files passed security validation"]);
        return;
      }

      // Use the new file upload system for each file
      for (const file of validFiles) {
        try {
          await uploadFile(file);
        } catch (error) {
          console.error(`Failed to upload file ${file.name}:`, error);
          setUploadErrors((prev) => [...prev, `Failed to upload ${file.name}`]);
        }
      }

      // Clear the message input after sending files
      setMessage("");
      clearDraft();
    },
    [uploadFile, clearDraft]
  );

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove?.previewUrl) {
        revokeManagedUrl(fileToRemove.previewUrl);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const handleCameraCapture = useCallback(
    async (facing: "user" | "environment" = "environment") => {
      setShowCameraOptions(false);
      clearError();

      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const capturedFile = await captureFromCamera(facing);
      if (capturedFile) {
        // Apply file rules validation to camera-captured files
        try {
          const validation = await validateFiles(
            [capturedFile],
            DEFAULT_FILE_RESTRICTIONS
          );
          const validFiles = validation.fileResults
            .filter((r) => r.isValid)
            .map((r) => r.file);

          if (validation.errors.length > 0) {
            // Show errors as alerts instead of setting upload errors
            validation.errors.forEach((error) => {
              // alert(`File Upload Error3: ${error}`);
            });
            setUploadErrors([]);
            return;
          }

          if (validation.warnings.length > 0) {
            console.warn(
              "Camera file validation warnings:",
              validation.warnings
            );
          }

          if (validFiles.length > 0) {
            await handleFileSelect(validFiles);
          }
        } catch (error) {
          console.error("Error validating camera file:", error);
          setUploadErrors(["Failed to validate camera file"]);
        }

        // Close all modals and dropdowns after sending the image
        setShowCameraOptions(false);
        setShowMoreOptions(false);
      }
    },
    [requestPermissions, captureFromCamera, clearError, handleFileSelect]
  );

  // Open native camera
  const openNativeCamera = useCallback(
    async (facing: "user" | "environment") => {
      setShowCameraOptions(false);
      clearError();

      try {
        // Create a temporary file input with camera capture
        const tempInput = document.createElement("input");
        tempInput.type = "file";
        tempInput.accept = "image/*";
        tempInput.capture = facing === "user" ? "user" : "environment";

        // Handle file selection
        tempInput.onchange = async (e) => {
          const target = e.target as HTMLInputElement;
          if (target.files && target.files.length > 0) {
            const capturedFile = target.files[0];

            // Apply file rules validation to native camera files
            try {
              const validation = await validateFiles(
                [capturedFile],
                DEFAULT_FILE_RESTRICTIONS
              );
              const validFiles = validation.fileResults
                .filter((r) => r.isValid)
                .map((r) => r.file);

              if (validation.errors.length > 0) {
                // Show errors as alerts instead of setting upload errors
                validation.errors.forEach((error) => {
                  // alert(`File Upload Error4: ${error}`);
                });
                setUploadErrors([]);
                return;
              }

              if (validation.warnings.length > 0) {
                console.warn(
                  "Native camera file validation warnings:",
                  validation.warnings
                );
              }

              if (validFiles.length > 0) {
                await handleFileSelect(validFiles);
              }
            } catch (error) {
              console.error("Error validating native camera file:", error);
              setUploadErrors(["Failed to validate camera file"]);
            }

            // Close all modals and dropdowns after sending the image
            setShowCameraOptions(false);
            setShowMoreOptions(false);
          }
        };

        // Trigger camera
        tempInput.click();

        // Clean up
        setTimeout(() => {
          if (document.body.contains(tempInput)) {
            document.body.removeChild(tempInput);
          }
        }, 1000);
      } catch (error) {
        console.error("Error opening native camera:", error);
      }
    },
    [clearError, handleFileSelect]
  );

  // Camera option for More Options menu
  const handleCameraOptionClick = useCallback(() => {
    if (!capabilities.isMobile || !capabilities.hasCamera) {
      return;
    }

    // Close More Options dropdown
    setShowMoreOptions(false);

    // Show camera options modal
    if (capabilities.hasFrontCamera && capabilities.hasBackCamera) {
      setShowCameraOptions(true);
    } else {
      // Auto-select the available camera
      openNativeCamera(capabilities.hasBackCamera ? "environment" : "user");
    }
  }, [capabilities, openNativeCamera]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if we're dragging files
    if (e.dataTransfer.types.includes("Files")) {
      // console.log("Drag over detected with files:", e.dataTransfer.types);
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set drag over to false if we're leaving the drop zone completely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    // console.log("Drop event triggered, files:", files);

    if (files && files.length > 0) {
      // Apply file rules validation to dropped files
      handleFileSelect(files);
    } else {
      console.log("No files found in drop event");
    }
  };

  // Emoji handling state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // More options state
  const moreOptionsBtnRef = useRef<HTMLButtonElement>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);

  const { widgetSettings } = useWidgetContext();
  const compressionSettings = { enabled: true, maxSizeMB: 1, quality: 0.7 };

  // Enhanced fallback compression using Canvas with metadata support
  const compressWithCanvas = async (
    file: File,
    metadata?: {
      orientationInfo?: any;
      animationInfo?: any;
      modernFormatInfo?: any;
    }
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img;
          const maxWidth = 1200;
          const maxHeight = 1200;
          const aspectRatio = width / height;

          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }
          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Apply orientation correction if needed
          if (
            metadata?.orientationInfo &&
            metadata.orientationInfo.orientation !== 1
          ) {
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(
              ((metadata.orientationInfo.orientation - 1) * 90 * Math.PI) / 180
            );
            ctx.drawImage(img, -width / 2, -height / 2, width, height);
            ctx.restore();
          } else {
            // Draw and compress normally
            ctx.drawImage(img, 0, 0, width, height);
          }

          // Choose output format based on metadata
          let outputFormat = "image/jpeg";
          let quality = 0.8;

          if (metadata?.animationInfo?.isAnimated) {
            // For animated images, use PNG to preserve transparency
            outputFormat = "image/png";
            quality = 1.0;
          } else if (metadata?.modernFormatInfo?.formatInfo?.isModernFormat) {
            // For modern formats, use WebP if supported
            outputFormat = "image/webp";
            quality = 0.9;
          }

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: outputFormat,
                  lastModified: Date.now(),
                });
                console.log(
                  `[ChatInput] Enhanced canvas compression successful: ${file.size} -> ${compressedFile.size} bytes (${outputFormat})`
                );
                resolve(compressedFile);
              } else {
                reject(new Error("Failed to create blob"));
              }
            },
            outputFormat,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const processSingleFile = async (file: File): Promise<File> => {
    setFileState(file, { status: "processing" });

    const isImage = (file.type || "").toLowerCase().startsWith("image/");

    // console.log(`[ChatInput] Processing file: ${file.name} (${file.type}, ${file.size} bytes, isImage: ${isImage})`);

    // Enhanced metadata extraction for images
    let exifData: any,
      orientationInfo: any,
      animationInfo: any,
      modernFormatInfo: any;
    let compatibilityWarnings: string[] = [];

    if (isImage) {
      try {
        // Extract EXIF data and orientation info
        exifData = await extractEXIFData(file);
        orientationInfo = getOrientationInfo(exifData.orientation);

        // Detect animated formats
        animationInfo = await detectAnimatedFormatEnhanced(file);

        // Detect modern formats
        modernFormatInfo = await detectModernFormat(file);

        // Collect compatibility warnings
        if (animationInfo.warningLevel === "warning") {
          compatibilityWarnings.push(animationInfo.userMessage);
        }
        if (modernFormatInfo.warningLevel === "warning") {
          compatibilityWarnings.push(modernFormatInfo.userMessage);
        }
        if (orientationInfo.orientation !== 1) {
          compatibilityWarnings.push(
            "Image orientation will be corrected during processing"
          );
        }

        // Log metadata for debugging
        if (compatibilityWarnings.length > 0) {
          console.log(
            `[ChatInput] Compatibility warnings for ${file.name}:`,
            compatibilityWarnings
          );
        }
      } catch (error) {
        console.warn(
          `[ChatInput] Failed to extract metadata for ${file.name}:`,
          error
        );
      }
    }

    // For non-images, return as-is
    if (!isImage) {
      console.log(
        `[ChatInput] Non-image file, skipping compression: ${file.name}`
      );
      setFileState(file, { status: "compressed" });
      return file;
    }

    // Enhanced format detection for compression decisions
    const shouldSkipCompression =
      file.type.toLowerCase().includes("gif") ||
      (file.type.toLowerCase().includes("webp") && file.size > 1024 * 1024) ||
      (animationInfo?.isAnimated && animationInfo.warningLevel === "warning") ||
      file.size < 100 * 1024;

    if (shouldSkipCompression) {
      const reason = file.type.toLowerCase().includes("gif")
        ? "GIF format"
        : file.type.toLowerCase().includes("webp") && file.size > 1024 * 1024
        ? "Large WebP"
        : animationInfo?.isAnimated && animationInfo.warningLevel === "warning"
        ? "Animated format with warnings"
        : "File too small";
      // console.log(`[ChatInput] Skipping compression for ${file.name}: ${reason}`);
      setFileState(file, { status: "compressed" });
      return file;
    }

    try {
      // Use the compression worker properly
      if (isWorkerSupported) {
        // console.log(`[ChatInput] Using compression worker for: ${file.name}`);
        // console.log(`[ChatInput] Worker supported: ${isWorkerSupported}`);

        const compressedFile = await new Promise<File>((resolve, reject) => {
          const taskId = `task_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          // console.log(`[ChatInput] Generated task ID: ${taskId} for file: ${file.name}`);
          // console.log(`[ChatInput] Calling compression worker with task ID: ${taskId}`);

          let isResolved = false; // Flag to prevent multiple resolutions

          // Add timeout to prevent hanging
          const timeout = setTimeout(() => {
            if (!isResolved) {
              console.warn(
                `[ChatInput] Compression timeout for ${file.name}, using original`
              );
              isResolved = true;
              resolve(file);
            }
          }, 30000); // Increased timeout to 30 seconds

          // Enhanced compression options with metadata
          const enhancedOptions = {
            quality: 0.8,
            maxWidth: 1200,
            maxHeight: 1200,
            preserveAnimated: animationInfo?.isAnimated || false,
            correctOrientation: orientationInfo?.orientation !== 1,
            orientationInfo,
            modernFormat: modernFormatInfo?.formatInfo?.isModernFormat || false,
          };

          compressWithWorker({
            id: taskId,
            file,
            options: enhancedOptions,
            onComplete: (result) => {
              if (!isResolved) {
                clearTimeout(timeout);
                isResolved = true;
                try {
                  // console.log(`[ChatInput] Compression completed for ${file.name}:`, result);
                  // Create a new file from the compressed blob
                  const newFile = new File([result.blob], file.name, {
                    type: result.outputFormat || file.type,
                    lastModified: Date.now(),
                  });
                  // console.log(`[ChatInput] Compression successful for ${file.name}: ${file.size} -> ${newFile.size} bytes`);
                  resolve(newFile);
                } catch (error) {
                  console.error(
                    `[ChatInput] Error creating compressed file for ${file.name}:`,
                    error
                  );
                  resolve(file); // Fallback to original
                }
              }
            },
            onError: (error) => {
              if (!isResolved) {
                clearTimeout(timeout);
                isResolved = true;
                console.error(
                  `[ChatInput] Worker compression failed for ${file.name}:`,
                  error
                );
                // Try canvas fallback with metadata
                // console.log(`[ChatInput] Trying canvas fallback for ${file.name}`);
                const metadata = {
                  orientationInfo,
                  animationInfo,
                  modernFormatInfo,
                };
                compressWithCanvas(file, metadata)
                  .then((compressedFile) => {
                    // console.log(`[ChatInput] Canvas fallback successful for ${file.name}`);
                    resolve(compressedFile);
                  })
                  .catch((canvasError) => {
                    console.warn(
                      `[ChatInput] Canvas fallback also failed for ${file.name}:`,
                      canvasError
                    );
                    resolve(file); // Fallback to original file
                  });
              }
            },
          });
        });

        setFileState(file, { status: "compressed" });
        return compressedFile;
      } else {
        // Fallback: try canvas compression
        console.warn(
          `[ChatInput] Compression worker not supported, trying canvas fallback for: ${file.name}`
        );
        try {
          const compressedFile = await compressWithCanvas(file);
          setFileState(file, { status: "compressed" });
          return compressedFile;
        } catch (error) {
          console.warn(
            `[ChatInput] Canvas compression failed, using original file: ${file.name}`,
            error
          );
          setFileState(file, { status: "compressed" });
          return file;
        }
      }
    } catch (error) {
      console.warn(
        `[ChatInput] Compression failed for ${file.name}, using original:`,
        error
      );
      // If compression fails, return the original file
      setFileState(file, { status: "compressed" });
      return file;
    }
  };

  const processFilesWithRetry = async (files: File[]): Promise<File[]> => {
    const results: File[] = [];

    for (const file of files) {
      try {
        setFileState(file, { status: "processing" });

        // Process the file (compress if it's an image)
        const processedFile = await processSingleFile(file);

        setFileState(file, { status: "compressed" });
        results.push(processedFile);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        setFileState(file, {
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        });
        // Add the original file if processing fails
        results.push(file);
      }
    }

    return results;
  };

  const canAcceptMore = () => {
    return !processingFiles;
  };

  const enqueueOrProcess = async (newFiles: File[]) => {
    if (!canAcceptMore()) {
      alert(
        "Please wait for the current batch to finish before adding more files."
      );
      return;
    }
    if (isOffline) {
      offlineQueueRef.current.push(...newFiles);
      alert(
        `You're offline. Queued ${newFiles.length} file(s). They will be sent automatically when you're back online.`
      );
      return;
    }

    // Apply file rules validation before processing
    try {
      const validation = await validateFiles(
        newFiles,
        DEFAULT_FILE_RESTRICTIONS
      );
      const validFiles = validation.fileResults
        .filter((r) => r.isValid)
        .map((r) => r.file);

      if (validation.errors.length > 0) {
        // Show errors as alerts instead of setting upload errors
        validation.errors.forEach((error) => {
          // alert(`File Upload Error5: ${error}`);
        });
        setUploadErrors([]);
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn("Enqueue validation warnings:", validation.warnings);
      }

      if (validFiles.length > 0) {
        await processAndSendFiles(validFiles, "", sessionId);
      }
    } catch (error) {
      console.error("Error validating files for enqueue:", error);
      setUploadErrors(["Failed to validate files for processing"]);
    }
  };

  // Handle direct file input (bypassing the preview system)
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    e.target.value = ""; // Clear the input

    // Apply file rules validation to direct file input
    try {
      const validation = await validateFiles(
        newFiles,
        DEFAULT_FILE_RESTRICTIONS
      );
      const validFiles = validation.fileResults
        .filter((r) => r.isValid)
        .map((r) => r.file);

      if (validation.errors.length > 0) {
        // Show errors as alerts instead of setting upload errors
        validation.errors.forEach((error) => {
          // alert(`File Upload Error6: ${error}`);
        });
        setUploadErrors([]);
      }

      if (validation.warnings.length > 0) {
        console.warn(
          "Direct file input validation warnings:",
          validation.warnings
        );
      }

      if (validFiles.length === 0) {
        setUploadErrors(["No valid files selected"]);
        return;
      }

      // Use new enhanced file handling
      await handleFileSelect(validFiles);
    } catch (error) {
      console.error("Error validating direct file input:", error);
      setUploadErrors(["Failed to validate selected files"]);
    }
  };

  // Handle paste - send files immediately
  const handlePaste = async (
    e: React.ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    if (!canAcceptMore()) {
      e.preventDefault();
      return;
    }

    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (const item of items) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f && f instanceof File) files.push(f);
      }
    }

    if (files.length > 0) {
      e.preventDefault();

      // Apply file rules validation to pasted files
      try {
        const validation = await validateFiles(
          files,
          DEFAULT_FILE_RESTRICTIONS
        );
        const validFiles = validation.fileResults
          .filter((r) => r.isValid)
          .map((r) => r.file);

        if (validation.errors.length > 0) {
          // Show errors as alerts instead of setting upload errors
          validation.errors.forEach((error) => {
            // alert(`File Upload Error7: ${error}`);
          });
          setUploadErrors([]);
        }

        if (validation.warnings.length > 0) {
          console.warn("Pasted file validation warnings:", validation.warnings);
        }

        if (validFiles.length === 0) {
          setUploadErrors(["No valid files found in clipboard"]);
          return;
        }

        // Immediately send valid pasted files with loading message
        await processAndSendFiles(validFiles, message.trim(), sessionId);

        // Clear message after sending files
        setMessage("");
        clearDraft();
      } catch (error) {
        console.error("Error validating pasted files:", error);
        setUploadErrors(["Failed to validate pasted files"]);
      }
    } else {
      // Handle text paste with smart formatting
      const pastedText = handleSmartPaste(e.clipboardData);
      if (pastedText && pastedText !== e.clipboardData.getData("text/plain")) {
        e.preventDefault();
        const textarea = e.target as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = textarea.value;

        const newValue =
          currentValue.substring(0, start) +
          pastedText +
          currentValue.substring(end);
        setMessage(newValue);
        handleTyping(newValue.trim().length > 0);

        // Save draft after paste
        if (isStorageAvailable) {
          saveDraft(newValue);
        }
      }
    }
  };

  // Auto-focus when chat opens
  const InputFocus = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (toggleChatOpen) InputFocus.current?.focus();
  }, [toggleChatOpen]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // New useEffect hooks for enhanced functionality
  useEffect(() => {
    if (hasDraft && !message && draftContent) {
      setMessage(draftContent);
    }
  }, [hasDraft, draftContent, message]);

  useEffect(() => {
    return () => {
      uploadedFiles.forEach((file) => {
        if (file.previewUrl) {
          revokeManagedUrl(file.previewUrl);
        }
      });
    };
  }, [uploadedFiles]);

  if (isPreChatForm) return null;

  const toggleTranscript = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTranscript(!showTranscript);
  };

  const toggleSoundHandler = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSoundEnabled(!soundEnabled);
  };

  // Handle typing state
  const handleTyping = useCallback(
    (isUserTyping: boolean) => {
      if (!onTyping) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (isUserTyping && !isTyping) {
        setIsTyping(true);
        onTyping(true);
      } else if (!isUserTyping && isTyping) {
        setIsTyping(false);
        onTyping(false);
      }

      if (isUserTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          onTyping(false);
        }, 2000);
      }
    },
    [onTyping, isTyping]
  );

  // Handle form submission with files and message
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Check if we have a message to send or files to send
    const trimmedMessage = message.trim();
    const completedFiles = uploadedFiles
      .filter((f) => f.status === "complete" && f.compressedFile)
      .map((f) => f.compressedFile!);

    if (!trimmedMessage && completedFiles.length === 0) return;

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Process rich text for URLs and formatting
    const processedMessage = processRichText(trimmedMessage);
    setIsTyping(false);
    onTyping?.(false);

    // Send the message with files if any
    onSendMessage(
      processedMessage.processedText,
      completedFiles.length > 0 ? completedFiles : undefined
    );

    // Reset state
    setMessage("");
    setUploadedFiles([]);
    setUploadErrors([]);

    // Clear draft after sending
    clearDraft();

    // Re-focus input
    setTimeout(() => InputFocus.current?.focus(), 50);
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    // Don't close the emoji picker - let user select multiple emojis
    // setShowEmojiPicker(false);
  };

  // Add offline/online event listeners
  useEffect(() => {
    const onOnline = async () => {
      setIsOffline(false);
      if (offlineQueueRef.current.length > 0) {
        const toSend = [...offlineQueueRef.current];
        offlineQueueRef.current = [];

        // Apply file rules validation to offline queue files
        try {
          const validation = await validateFiles(
            toSend,
            DEFAULT_FILE_RESTRICTIONS
          );
          const validFiles = validation.fileResults
            .filter((r) => r.isValid)
            .map((r) => r.file);

          if (validation.errors.length > 0) {
            // Show errors as alerts instead of setting upload errors
            validation.errors.forEach((error) => {
              // alert(`File Upload Error8: ${error}`);
            });
          }

          if (validation.warnings.length > 0) {
            console.warn(
              "Offline queue validation warnings:",
              validation.warnings
            );
          }

          if (validFiles.length > 0) {
            await processAndSendFiles(validFiles, "", sessionId);
          }
        } catch (error) {
          console.error("Error validating offline queue files:", error);
        }
      }
    };
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <div
      className={cn(
        "relative bg-white rounded-b-lg animate-message-fade-in",
        isChatBadge ? "border-t-0 p-0 px-1 pb-1" : "border-t p-3",
        "chat-input-container"
      )}
      style={{
        borderBottomLeftRadius: 6,
        borderBottomRightRadius: 6,
        // borderBottomLeftRadius: widgetSettings?.appearance.borderRadius,
        // borderBottomRightRadius: widgetSettings?.appearance.borderRadius,
      }}
      dir={direction}
      data-rtl={isRTL}
    >
      <div className="animate-message-fade-in">
        <ComplianceIndicator
          files={uploadedFiles.map((f) => f.file)}
          textContent={message}
          onComplianceResult={setComplianceResult}
        />
      </div>
      {!isChatBadge &&
        isTagEnable &&
        widgetSettings?.forms.userInfoForm.enabled && (
          <div
            className={cn(
              "absolute text-[#3b82f6] font-medium underline cursor-pointer bottom-[calc(100%+0.5rem)] text-xs",
              isRTL ? "right-1/2 translate-x-1/2" : "left-1/2 -translate-x-1/2"
            )}
            onClick={onClick}
          >
            Please update your info
          </div>
        )}

      {/* New UI elements for enhanced functionality */}
      {uploadErrors.length > 0 && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg animate-message-fade-in">
          <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-2">
            <AlertCircle size={16} />
            Upload Errors
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {uploadErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {cameraError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg animate-message-fade-in">
          <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-2">
            <AlertCircle size={16} />
            Camera Error
          </div>
          <p className="text-sm text-red-700">
            {formatCameraError(cameraError)}
          </p>
        </div>
      )}

      {/* Mobile Camera Capture Indicator */}
      {isCapturing && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-message-fade-in">
          <div className="flex items-center gap-2 text-[#3b82f6] text-sm font-medium mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3b82f6]"></div>
            Capturing Photo...
          </div>
          <p className="text-sm text-[#3b82f6]">
            Please look at your camera and stay still. The photo will be
            captured automatically.
          </p>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mb-3 p-3 border border-gray-200 bg-gray-50 rounded-lg animate-message-fade-in">
          <div
            className={cn(
              "flex items-center mb-2",
              isRTL ? "justify-between flex-row-reverse" : "justify-between"
            )}
          >
            <h4
              className={cn(
                "text-sm font-medium text-gray-700",
                isRTL ? "flex items-center" : "flex items-center"
              )}
            >
              Files ({uploadedFiles.length})
              {uploadedFiles.some((f) => f.status === "compressing") && (
                <span className={cn("text-[#3b82f6]", isRTL ? "mr-2" : "ml-2")}>
                  Processing...
                </span>
              )}
            </h4>
            <button
              onClick={() => {
                uploadedFiles.forEach((f) => handleRemoveFile(f.id));
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
              type="button"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border"
              >
                {file.previewUrl && file.type.startsWith("image/") ? (
                  <img
                    src={file.previewUrl || "/placeholder.svg"}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                    style={{
                      transform: file.orientationInfo?.cssTransform || "none",
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                    <Upload size={16} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                    {file.status === "compressing" && ` • ${file.progress}%`}
                    {file.status === "error" && " • Error"}
                    {file.status === "complete" && " • Ready"}
                  </div>

                  {file.compatibilityWarnings &&
                    file.compatibilityWarnings.length > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        {file.compatibilityWarnings.map((warning, index) => (
                          <div key={index} className="flex items-center gap-1">
                            <AlertCircle size={10} />
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex items-center" noValidate>
        <div className="flex items-end w-full">
          <div className="flex-1 relative">
            {/* File processing indicator */}
            {processingFiles && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3 text-[#3b82f6]">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#3b82f6]"></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Uploading...</span>
                    {/* <span className="text-xs text-blue-500">Please wait while we prepare your files</span> */}
                  </div>
                </div>
              </div>
            )}

            {/* Drag and Drop Zone */}
            <div
              className={cn(
                "relative transition-all duration-200 rounded-lg  min-h-[80px]",
                isDragOver
                  ? "bg-blue-50 border-[#3b82f6] scale-[1.02] shadow-lg"
                  : "border-transparent hover:border-gray-200 hover:bg-gray-50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {!isChatBadge && (
                <textarea
                  id="chat-message-input"
                  ref={InputFocus}
                  className={cn(
                    "w-full border rounded-lg py-2 px-3",
                    "focus:ring-2 focus:ring-[#3b82f6] resize-none",
                    "min-h-[80px] transition-all duration-200",
                    // isDragOver ? "border-none" : "",
                    characterLimit.isAtError
                      ? "border-red-300 focus:ring-red-500"
                      : characterLimit.isAtWarning
                      ? "border-orange-300 focus:ring-orange-500"
                      : "border-gray-300",
                    isDragOver && "border-[#3b82f6] bg-blue-50 border-none"
                  )}
                  value={message}
                  onChange={(e) => {
                    const value = e.target.value;

                    // Enforce hard character limit
                    if (
                      characterLimit.isAtHardLimit &&
                      value.length > message.length
                    ) {
                      return; // Prevent typing beyond hard limit
                    }

                    setMessage(value);
                    if (value.length > 0) {
                      handleTyping(true);
                    } else {
                      handleTyping(false);
                    }

                    // Save draft
                    if (isStorageAvailable && value.trim()) {
                      saveDraft(value);
                    } else if (!value.trim()) {
                      clearDraft();
                    }
                  }}
                  onKeyDown={(e) => {
                    const hasContent = message.length > 0;
                    const isTypingKey = ![
                      "Enter",
                      "Tab",
                      "Escape",
                      "Backspace",
                    ].includes(e.key);

                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (message.trim()) {
                        handleSubmit(e as any);
                      }
                      return;
                    }

                    if (hasContent && isTypingKey) {
                      handleTyping(true);
                    } else if (!hasContent) {
                      handleTyping(false);
                    }
                  }}
                  onPaste={handlePaste}
                  dir={direction}
                  placeholder={
                    isDragOver
                      ? ""
                      : widgetSettings?.content.inputPlaceholder ||
                        t("widget.input.placeholder")
                  }
                  disabled={processingFiles}
                  style={{
                    fontSize: 14,
                    color: "#000000",
                    // fontSize: widgetSettings?.appearance.fontSize,
                    // color: widgetSettings?.appearance.colors.text,
                  }}
                  rows={3}
                />
              )}

              {/* Drag Overlay */}
              {isDragOver && (
                <div
                  className={cn(
                    "absolute inset-0 bg-blue-100/80",
                    "border-2 border-dashed border-[#3b82f6]",
                    "rounded-lg flex items-center justify-center",
                    "z-10 pointer-events-none"
                  )}
                >
                  <div
                    className={cn(
                      "text-center",
                      isRTL ? "text-right" : "text-left"
                    )}
                  >
                    <Upload size={32} className="text-[#3b82f6] mx-auto" />
                    <p className="text-[#3b82f6] font-medium text-sm">
                      {t("widget.file.dropFilesHere")}
                    </p>
                    {/* <p className="text-[#3b82f6] text-xs mt-1">
                      Images, videos, documents, and more
                    </p> */}
                  </div>
                </div>
              )}
            </div>

            {/* Drag and Drop Hint
            {!isDragOver && !processingFiles && (
              <div className="text-center text-xs text-gray-400 mt-2 mb-1">
                💡 You can also drag & drop files here
              </div>
            )} */}

            <div
              className={cn(
                "flex items-center text-gray-500 mt-1",
                isRTL ? "justify-between flex-row-reverse" : "justify-between"
              )}
            >
              {!isChatBadge && (
                <div className="text-xs">{t("widget.branding.poweredBy")}</div>
              )}
              <div
                className={cn(
                  "flex items-center gap-2 relative",
                  isRTL ? "flex-row-reverse" : "",
                  isChatBadge ? "w-full" : ""
                )}
              >
                {!isChatBadge && (
                  <>
                    {/* Hidden file input for advanced file handling */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                      multiple
                    />

                    {/* File attachment button */}
                    <button
                      type="button"
                      onClick={() => {
                        // Open file picker for selecting any file, image, or video
                        fileInputRef.current?.click();
                      }}
                      className={cn(
                        "transition-all duration-200",
                        isDragOver
                          ? "text-[#3b82f6] scale-110"
                          : "hover:text-[#3b82f6]"
                      )}
                      aria-label={t("widget.input.attachment")}
                      title={t("widget.input.attachment")}
                    >
                      <Paperclip size={18} />
                    </button>

                    {/* Test compression button (for debugging) */}
                    {/* {process.env.NODE_ENV === 'development' && (
                      <button
                        type="button"
                        onClick={async () => {
                          // Create a test image file
                          const canvas = document.createElement('canvas');
                          canvas.width = 800;
                          canvas.height = 600;
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            // Draw a test pattern
                            ctx.fillStyle = '#ff0000';
                            ctx.fillRect(0, 0, 400, 300);
                            ctx.fillStyle = '#00ff00';
                            ctx.fillRect(400, 0, 400, 300);
                            ctx.fillStyle = '#0000ff';
                            ctx.fillRect(0, 300, 400, 300);
                            ctx.fillStyle = '#ffff00';
                            ctx.fillRect(400, 300, 400, 300);
                            
                            canvas.toBlob(async (blob) => {
                              if (blob) {
                                const testFile = new File([blob], 'test-image.png', { type: 'image/png' });
                                console.log(`[Test] Created test file: ${testFile.size} bytes`);
                                
                                try {
                                  const compressed = await processSingleFile(testFile);
                                  console.log(`[Test] Compression result: ${testFile.size} -> ${compressed.size} bytes`);
                                } catch (error) {
                                  console.error(`[Test] Compression failed:`, error);
                                }
                              }
                            }, 'image/png');
                          }
                        }}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        title="Test compression (dev only)"
                      >
                        Test
                      </button>
                    )} */}

                    {showCameraOptions && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
                          <div className="text-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Choose Camera
                            </h3>
                            <p className="text-sm text-gray-600">
                              Select which camera to use
                            </p>
                          </div>

                          <div className="space-y-3">
                            {capabilities.hasBackCamera && (
                              <button
                                type="button"
                                onClick={() => openNativeCamera("environment")}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                              >
                                <Camera size={20} />
                                Back Camera
                              </button>
                            )}
                            {capabilities.hasFrontCamera && (
                              <button
                                type="button"
                                onClick={() => openNativeCamera("user")}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                              >
                                <Camera size={20} />
                                Front Camera
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setShowCameraOptions(false);
                                fileInputRef.current?.click();
                              }}
                              className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                            >
                              <Paperclip size={20} />
                              Choose File Instead
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowCameraOptions(false)}
                            className="w-full mt-4 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEmojiPicker(!showEmojiPicker);
                      }}
                      className="hover:text-[#3b82f6]"
                    >
                      <Smile size={18} />
                    </button>
                    {showEmojiPicker && (
                      <EmojiPicker
                        onEmojiSelect={handleEmojiSelect}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    )}
                    <button
                      className="hover:text-[#3b82f6] transition-colors relative"
                      aria-label="More Options"
                      ref={moreOptionsBtnRef}
                      onClick={() => setShowMoreOptions((prev) => !prev)}
                    >
                      <Ellipsis size={18} />
                      {showMoreOptions && (
                        <MoreOptions
                          toggleTranscript={toggleTranscript}
                          soundEnabled={soundEnabled}
                          toggleSoundHandler={toggleSoundHandler}
                          onClose={() => setShowMoreOptions(false)}
                          parentRef={moreOptionsBtnRef}
                          onCameraClick={handleCameraOptionClick}
                          showCameraOption={
                            capabilities.isMobile && capabilities.hasCamera
                          }
                        />
                      )}
                    </button>
                  </>
                )}
                <div className="border flex items-center gap-2 rounded-md w-full">
                  {isChatBadge && (
                    <input
                      type="text"
                      value={message}
                      id="chat-message-input"
                      onChange={(e) => {
                        const value = e.target.value;

                        // Enforce hard character limit
                        if (
                          characterLimit.isAtHardLimit &&
                          value.length > message.length
                        ) {
                          return; // Prevent typing beyond hard limit
                        }

                        setMessage(value);
                        if (value.length > 0) {
                          handleTyping(true);
                        } else {
                          handleTyping(false);
                        }

                        // Save draft
                        if (isStorageAvailable && value.trim()) {
                          saveDraft(value);
                        } else if (!value.trim()) {
                          clearDraft();
                        }
                      }}
                      onKeyDown={(e) => {
                        const hasContent = message.length > 0;
                        const isTypingKey = ![
                          "Enter",
                          "Tab",
                          "Escape",
                          "Backspace",
                        ].includes(e.key);

                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (message.trim()) {
                            handleSubmit(e as any);
                          }
                          return;
                        }

                        if (hasContent && isTypingKey) {
                          handleTyping(true);
                        } else if (!hasContent) {
                          handleTyping(false);
                        }
                      }}
                      onPaste={handlePaste}
                      dir={direction}
                      placeholder={
                        widgetSettings?.content.inputPlaceholder ||
                        t("widget.input.placeholder")
                      }
                      disabled={
                        (!message.trim() && uploadedFiles.length === 0) ||
                        characterLimit.isAtHardLimit ||
                        processingFiles
                      }
                      autoComplete="off"
                      className="flex-1 border-none outline-none px-3 py-1 text-sm"
                      style={{
                        fontSize: widgetSettings?.appearance.fontSize,
                        color: widgetSettings?.appearance.colors.text,
                      }}
                    />
                  )}
                  {isChatBadge && (
                    <button
                      type="submit"
                      id="chat-message-submit"
                      disabled={
                        (!message.trim() && uploadedFiles.length === 0) ||
                        characterLimit.isAtHardLimit ||
                        processingFiles
                      }
                      className={`p-2 rounded-full transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 ${
                        (!message.trim() && uploadedFiles.length === 0) ||
                        characterLimit.isAtHardLimit ||
                        processingFiles
                          ? "text-gray-300"
                          : "text-[#3b82f6] hover:text-[#3b82f6]"
                      }`}
                      aria-label={t("widget.button.sendMessage")}
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Character limit counter */}
      {characterLimit.shouldShowCounter && (
        <div
          className={cn(
            "mb-2 text-xs flex items-center animate-message-fade-in",
            isRTL ? "justify-between flex-row-reverse" : "justify-between",
            characterLimit.isAtError
              ? "text-red-600"
              : characterLimit.isAtWarning
              ? "text-orange-600"
              : "text-gray-500"
          )}
        >
          <span>{characterLimit.warningMessage}</span>
          <span>
            {characterLimit.count}/{characterLimit.isAtError ? "2000" : "1000"}
          </span>
        </div>
      )}
    </div>
  );
}
