"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface TypingIndicatorProps {
  agentTypingIndicator: TypingIndicatorPayload;
  className?: string;
}

export default function TypingIndicator({
  agentTypingIndicator,
  className,
}: TypingIndicatorProps) {
  /** ------------------ State & Refs ------------------ */
  const [ariaTyping, setAriaTyping] = useState(false);
  const [ariaLiveMsg, setAriaLiveMsg] = useState("");
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** ------------------ Sync ARIA with visual typing ------------------ */
  useEffect(() => {
    if (agentTypingIndicator) {
      setAriaTyping(true);
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

      debounceTimeout.current = setTimeout(() => {
        const message = "Agent is typing";
        setAriaLiveMsg(message);
        if (liveRegionRef.current) liveRegionRef.current.textContent = message;
      }, 120);
    } else {
      setAriaTyping(false);
      setAriaLiveMsg("");
      if (liveRegionRef.current) liveRegionRef.current.textContent = "";
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
        debounceTimeout.current = null;
      }
    };
  }, [agentTypingIndicator]);

  /** ------------------ Hide if not typing ------------------ */
  if (!agentTypingIndicator && !ariaTyping) return null;

  /** ------------------ Render ------------------ */
  return (
    <div className="flex gap-2 items-start" aria-live="off">
      {/* Screen-reader-only live region */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        {ariaLiveMsg}
      </div>

      {/* Typing dots bubble */}
      <div
        className={cn(
          "flex items-start max-w-[80%] rounded-lg p-2.5 bg-white",
          className
        )}
        role="status"
        aria-label="Agent is typing"
        tabIndex={-1}
      >
        <div className="inline-block px-3 py-2 max-w-[60px]">
          <div className="flex items-center justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                animate={{
                  scale: [1, 1.4, 1],
                  backgroundColor: ["#9ca3af", "#f0f5f1", "#9ca3af"], // gray-400 to white to gray-400
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
        <span className=" text-gray-400 text-xs text-nowrap">
          {agentTypingIndicator.clientName} is typing
        </span>
      </div>
    </div>
  );
}
