"use client";

import React, { useState, useRef } from "react";
import {
  X,
  File,
  FileText,
  ImageIcon,
  FileArchive,
  FilePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------ Types ------------------ */
type CompressionSettings = {
  enabled: boolean;
  maxSizeMB: number;
  quality: number;
};

export type FileUploadType = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  progress: number;
  status: "uploading" | "complete" | "error";
  file: File | Blob;
  previewUrl?: string;
  originalSize?: number;
};

type FileUploadProps = {
  onFileSelect: (files: FileUploadType[]) => void;
  onCancel: (fileId: string) => void;
  acceptedTypes?: string;
  maxSize?: number;
  multiple?: boolean;
  className?: string;
  compression?: CompressionSettings;
};

const defaultCompression: CompressionSettings = {
  enabled: true,
  maxSizeMB: 1,
  quality: 0.7,
};

/* ------------------ Utils ------------------ */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function compressImage(
  file: File,
  maxSizeMB = 1,
  quality = 0.7
): Promise<File | Blob> {
  if (!file.type.startsWith("image/") || file.size <= maxSizeMB * 1024 * 1024)
    return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let { width, height } = img;
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;

        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }
        if (height > MAX_HEIGHT) {
          width = (width * MAX_HEIGHT) / height;
          height = MAX_HEIGHT;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Could not get canvas context"));

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob)
              return reject(new Error("Canvas to Blob conversion failed"));
            const compressedBlob = Object.assign(blob, {
              name: file.name,
              lastModified: Date.now(),
            });
            resolve(compressedBlob);
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
  });
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return <ImageIcon size={24} />;
  if (fileType.includes("pdf")) return <FileText size={24} />;
  if (
    fileType.includes("zip") ||
    fileType.includes("rar") ||
    fileType.includes("tar")
  )
    return <FileArchive size={24} />;
  return <File size={24} />;
}

/* ------------------ File Upload ------------------ */
export function FileUpload({
  onFileSelect,
  onCancel,
  acceptedTypes = "*",
  maxSize = 10,
  multiple = true,
  className,
  compression,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
      e.target.value = ""; // allow re-selecting the same file
    }
  };

  const handleFiles = async (files: FileList) => {
    const compressionSettings = { ...defaultCompression, ...compression };

    const validFiles = Array.from(files).filter((file) => {
      if (file.size > maxSize * 1024 * 1024) return false;

      if (acceptedTypes !== "*") {
        const accepted = acceptedTypes
          .split(",")
          .map((t) => t.trim())
          .some((type) =>
            type.includes("*")
              ? file.type.startsWith(type.replace("*", ""))
              : file.type === type
          );
        return accepted;
      }
      return true;
    });

    const processedFiles = await Promise.all(
      validFiles.map(async (file) => {
        let processedFile: File | Blob = file;
        let originalSize;

        if (compressionSettings.enabled && file.type.startsWith("image/")) {
          try {
            const compressed = await compressImage(
              file,
              compressionSettings.maxSizeMB,
              compressionSettings.quality
            );
            if (compressed.size < file.size) {
              processedFile = compressed;
              originalSize = file.size;
            }
          } catch (err) {
            console.error(`Failed to compress ${file.name}:`, err);
          }
        }

        return {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: "name" in processedFile ? processedFile.name : file.name,
          size: processedFile.size,
          type: processedFile.type,
          url: "",
          progress: 0,
          status: "uploading",
          file: processedFile,
          previewUrl: processedFile.type.startsWith("image/")
            ? URL.createObjectURL(processedFile)
            : undefined,
          originalSize,
        } as FileUploadType;
      })
    );

    processedFiles.forEach(simulateUpload);
    onFileSelect(processedFiles);
  };

  const simulateUpload = (file: FileUploadType) => {
    // Comment out progress simulation - upload immediately
    // let progress = 0;
    // const interval = setInterval(() => {
    //   progress += Math.random() * 10;
    //   if (progress >= 100) {
    //     clearInterval(interval);
    //     Object.assign(file, {
    //       progress: 100,
    //       status: "complete",
    //       url: file.previewUrl || `https://example.com/files/${file.id}`,
    //     });
    //     // Only call onFileSelect once when upload is complete
    //     onFileSelect([file]);
    //   } else {
    //     file.progress = progress;
    //     // Update progress less frequently to reduce re-renders
    //     if (progress % 50 === 0) {
    //       onFileSelect([file]);
    //     }
    //   }
    // }, 500); // Increased interval to reduce frequency
    
    // Direct upload without progress simulation
    Object.assign(file, {
      progress: 100,
      status: "complete",
      url: file.previewUrl || `https://example.com/files/${file.id}`,
    });
    onFileSelect([file]);
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-400"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <FilePlus className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">
          Drag and drop files here, or{" "}
          <span className="text-blue-500 font-medium">browse</span>
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {acceptedTypes === "*"
            ? "All file types supported"
            : `Accepted: ${acceptedTypes}`}{" "}
          (Max: {maxSize}MB)
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={acceptedTypes}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}

/* ------------------ File Preview ------------------ */
export function FilePreview({
  file,
  onCancel,
}: {
  file: FileUploadType;
  onCancel: (id: string) => void;
}) {
  const isImage = file.type.startsWith("image/");
  const compressionInfo = file.originalSize && (
    <span className="text-xs text-green-600 ml-1">
      ({Math.round((1 - file.size / file.originalSize) * 100)}% smaller)
    </span>
  );

  return (
    <div className="flex items-center p-2 bg-gray-50 rounded-lg mb-2">
      {isImage && file.previewUrl ? (
        <div className="mr-2 h-10 w-10 rounded overflow-hidden flex-shrink-0">
          <img
            src={file.previewUrl}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="mr-2 text-gray-500">{getFileIcon(file.type)}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate">
          {file.name}
        </p>
        <div className="flex items-center">
          {file.status === "error" ? (
            <p className="text-xs text-red-500">Upload failed</p>
          ) : (
            <div className="flex items-center">
              <p className="text-xs text-gray-500">
                {formatFileSize(file.size)}
              </p>
              {compressionInfo}
            </div>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={`h-6 w-6 rounded-full ${
          file.status === "error" ? "text-red-500 hover:text-red-600" : ""
        }`}
        onClick={() => onCancel(file.id)}
        aria-label={
          file.status === "uploading" ? "Cancel upload" : "Remove file"
        }
      >
        <X size={14} />
      </Button>
    </div>
  );
}

/* ------------------ File Upload Button ------------------ */
export function FileUploadButton({
  onFileSelect,
  acceptedTypes = "*",
  maxSize = 10,
  multiple = true,
  children,
  className,
  compression,
}: FileUploadProps & { children: React.ReactNode }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files);
  };

  const handleFiles = async (files: FileList) => {
    const compressionSettings = { ...defaultCompression, ...compression };

    const processedFiles = await Promise.all(
      Array.from(files).map(async (file) => {
        let processedFile: File | Blob = file;
        let originalSize;

        if (compressionSettings.enabled && file.type.startsWith("image/")) {
          try {
            const compressed = await compressImage(
              file,
              compressionSettings.maxSizeMB,
              compressionSettings.quality
            );
            if (compressed.size < file.size) {
              processedFile = compressed;
              originalSize = file.size;
            }
          } catch (err) {
            console.error(`Failed to compress ${file.name}:`, err);
          }
        }

        return {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: "name" in processedFile ? processedFile.name : file.name,
          size: processedFile.size,
          type: processedFile.type,
          url: "",
          progress: 0,
          status: "uploading",
          file: processedFile,
          previewUrl: processedFile.type.startsWith("image/")
            ? URL.createObjectURL(processedFile)
            : undefined,
          originalSize,
        } as FileUploadType;
      })
    );

    processedFiles.forEach(simulateUpload);
    onFileSelect(processedFiles);
  };

  const simulateUpload = (file: FileUploadType) => {
    // Comment out progress simulation - upload immediately
    // let progress = 0;
    // const interval = setInterval(() => {
    //   progress += Math.random() * 10;
    //   if (progress >= 100) {
    //     clearInterval(interval);
    //     Object.assign(file, {
    //       progress: 100,
    //       status: "complete",
    //       url: file.previewUrl || `https://example.com/files/${file.id}`,
    //     });
    //     // Only call onFileSelect once when upload is complete
    //     onFileSelect([file]);
    //   } else {
    //     file.progress = progress;
    //     // Update progress less frequently to reduce re-renders
    //     if (progress % 50 === 0) {
    //       onFileSelect([file]);
    //     }
    //   }
    // }, 500); // Increased interval to reduce frequency
    
    // Direct upload without progress simulation
    Object.assign(file, {
      progress: 100,
      status: "complete",
      url: file.previewUrl || `https://example.com/files/${file.id}`,
    });
    onFileSelect([file]);
  };

  return (
    <>
      <div className={className} onClick={() => inputRef.current?.click()}>
        {children}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        accept={acceptedTypes}
        onChange={handleChange}
      />
    </>
  );
}
