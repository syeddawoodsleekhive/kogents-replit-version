"use client";

import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface ReadReceiptProps {
  status: "sent" | "delivered" | "read";
  className?: string;
}

export default function ReadReceipt({ status, className = "" }: ReadReceiptProps) {
  /** ------------------ State & Refs ------------------ */
  const [ariaAnnouncement, setAriaAnnouncement] = useState("");
  const prevStatus = useRef<ReadReceiptProps["status"]>(status); // Track previous status to prevent duplicate announcements
  const liveRegionRef = useRef<HTMLDivElement>(null);

  /** ------------------ Announce status changes ------------------ */
  useEffect(() => {
    if (prevStatus.current !== status) {
      const announcements: Record<ReadReceiptProps["status"], string> = {
        sent: "Message status: Sent",
        delivered: "Message status: Delivered",
        read: "Message status: Read",
      };
      setAriaAnnouncement(announcements[status]);
      prevStatus.current = status;
    }
  }, [status]);

  /** ------------------ Debounce ARIA updates ------------------ */
  useEffect(() => {
    if (!ariaAnnouncement) return;
    const timer = setTimeout(() => setAriaAnnouncement(""), 1200);
    return () => clearTimeout(timer);
  }, [ariaAnnouncement]);

  /** ------------------ Accessible Labels ------------------ */
  const ariaLabel =
    status === "read"
      ? "Message read"
      : status === "delivered"
      ? "Message delivered"
      : "Message sent";

  /** ------------------ Render ------------------ */
  return (
    <>
      {/* Live region for screen readers (invisible) */}
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
        {ariaAnnouncement}
      </div>

      {/* Visible status icon */}
      <span
        className={cn(status === "read" && "text-green-300", className)}
        aria-label={ariaLabel}
        aria-live="off"
        tabIndex={-1}
      >
        {status === "read" ? (
          <CheckCheck size={12} data-testid="read-receipt-icon" />
        ) : (
          <Check size={12} data-testid="read-receipt-icon" />
        )}
      </span>
    </>
  );
}
