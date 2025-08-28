"use client";

import React, { useState, useRef } from "react";
import { Paperclip } from "lucide-react";
import { useLiveAnnouncement } from "@/hooks/use-live-announcement";


interface AttachmentButtonProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const AttachmentButton: React.FC<AttachmentButtonProps> = ({
  onFileSelected,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Accessibility: live announcements
  const { liveRegionRef, announce, announcement } = useLiveAnnouncement(1200);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
      announce(`File selected: ${files[0].name}`);

      // Reset value so the same file can be selected again
      e.target.value = "";

      // Return focus to button after selection
      setTimeout(() => buttonRef.current?.focus(), 0);
    }
  };

  // Open file dialog
  const handleButtonClick = () => {
    fileInputRef.current?.click();
    announce("Attachment dialog opened");
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    announce("Drag file over to attach");
  };

  const handleDragLeave = () => {
    setIsDragging(false);
    announce("");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
      announce(`File dropped: ${files[0].name}`);
      setTimeout(() => buttonRef.current?.focus(), 0);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative ${isDragging ? "opacity-70" : ""}`}
      tabIndex={-1}
      aria-label="Attachment area"
    >
      {/* Live region for announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(1px, 1px, 1px, 1px)",
        }}
      >
        {announcement}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
        aria-label="Attach a file"
        tabIndex={-1}
        disabled={disabled}
      />

      {/* Attachment button */}
      <button
        ref={buttonRef}
        type="button"
        className="h-6 w-4 p-0 text-gray-500"
        onClick={handleButtonClick}
        disabled={disabled}
        aria-label="Attach a file"
        aria-describedby={isDragging ? "drag-desc" : undefined}
        aria-disabled={disabled}
        tabIndex={0}
      >
        <Paperclip className="h-5 w-5" />
      </button>

      {/* Screen reader description when dragging */}
      {isDragging && (
        <span id="drag-desc" className="sr-only">
          Drag a file here to attach
        </span>
      )}
    </div>
  );
};

export default AttachmentButton;
