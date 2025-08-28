"use client";

import React, { useRef, useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Upload, X } from "lucide-react";
import { validateFiles, DEFAULT_FILE_RESTRICTIONS } from "@/utils/file-rules";
import { cn } from "@/lib/utils";
import { useFileEncryption } from "@/hooks/use-file-encryption";

interface AttachmentButtonProps {
  onFileSelected: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

const AttachmentButton: React.FC<AttachmentButtonProps> = ({
  onFileSelected,
  disabled = false,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [sessionId, setSessionId] = useState("");

  // Initialize encryption with a unique session ID
  useEffect(() => {
    setSessionId(`widget_${Date.now()}`);
  }, []);

  const { encryptFile } = useFileEncryption(sessionId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      try {
        // Validate files using file-rules.ts
        const validationResult = await validateFiles(files, DEFAULT_FILE_RESTRICTIONS);

        if (validationResult.isValid) {
          // Encrypt each file before passing to parent (silently, no UI indicators)
          const processedFiles = [];
          for (const file of files) {
            try {
              console.log(`[v0] 🔐 Starting file encryption for: ${file.name}`);
              const taskId = await encryptFile(file);
              console.log(`[v0] ✅ File encryption started for ${file.name}: ${taskId}`);
              
              // Create a modified file object with encryption metadata
              const processedFile = Object.assign(file, {
                encryptionTaskId: taskId,
                isEncrypted: true
              });
              
              processedFiles.push(processedFile);
            } catch (error) {
              console.error(`[v0] ❌ File encryption failed for ${file.name}:`, error);
              // Still add the file even if encryption fails
              processedFiles.push(file);
            }
          }
          onFileSelected(processedFiles);
        } else {
          // Show validation errors
          const errorMessage = validationResult.errors.join('\n');
          alert(`File validation failed:\n${errorMessage}`);
        }
      } catch (error) {
        console.error('File validation error:', error);
        alert('Error validating files. Please try again.');
      }

      // Reset the input value so the same files can be selected again
      e.target.value = "";
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  }, [dragCounter]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      try {
        // Validate files using file-rules.ts
        const validationResult = await validateFiles(files, DEFAULT_FILE_RESTRICTIONS);

        if (validationResult.isValid) {
          // Encrypt each file before passing to parent (silently, no UI indicators)
          const processedFiles = [];
          for (const file of files) {
            try {
              console.log(`[v0] 🔐 Starting file encryption for: ${file.name}`);
              const taskId = await encryptFile(file);
              console.log(`[v0] ✅ File encryption started for ${file.name}: ${taskId}`);
              
              // Create a modified file object with encryption metadata
              const processedFile = Object.assign(file, {
                encryptionTaskId: taskId,
                isEncrypted: true
              });
              
              processedFiles.push(processedFile);
            } catch (error) {
              console.error(`[v0] ❌ File encryption failed for ${file.name}:`, error);
              // Still add the file even if encryption fails
              processedFiles.push(file);
            }
          }
          onFileSelected(processedFiles);
        } else {
          // Show validation errors
          const errorMessage = validationResult.errors.join('\n');
          alert(`File validation failed:\n${errorMessage}`);
        }
      } catch (error) {
        console.error('File validation error:', error);
        alert('Error validating files. Please try again.');
      }
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const getFileLimits = () => {
    const { maxFiles, maxFileSize, maxTotalSize } = DEFAULT_FILE_RESTRICTIONS;
    const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
    const maxTotalMB = Math.round(maxTotalSize / (1024 * 1024));
    return `up to ${maxFiles} files, max ${maxSizeMB}MB each, ${maxTotalMB}MB total`;
  };

  return (
    <div
      className={cn(
        "relative",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "p-0 rounded-full",
          isDragOver && "border-blue-500 bg-blue-50 ring-2 ring-blue-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        title={`Attach files (${getFileLimits()})`}
      >
        {isDragOver ? (
          <Upload className="h-5 w-5 text-blue-600" />
        ) : (
          <Paperclip className="h-5 w-5 text-gray-600" />
        )}
      </Button>

      {/* Drag & Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 -z-10 bg-blue-500 bg-opacity-10 rounded-full border-2 border-dashed border-blue-500 animate-pulse" />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
      />

      {/* Drag & Drop Instructions */}
      {isDragOver && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md shadow-lg z-50">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Drop files here to upload</span>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600" />
        </div>
      )}
    </div>
  );
};

export default AttachmentButton;
