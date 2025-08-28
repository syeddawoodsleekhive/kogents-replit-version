"use client";

import type React from "react";
import { useEffect, useRef } from "react";

interface CannedResponseDropdownProps {
  responses: CannedResponse[];
  selectedIndex: number;
  onSelect: (response: CannedResponse) => void;
  position: { top: number; left: number };
  visible: boolean;
  cannedResponseQuery?: string;
  setSelectedCannedIndex?: (value: number) => void;
}

const CannedResponseDropdown: React.FC<CannedResponseDropdownProps> = ({
  responses,
  selectedIndex,
  onSelect,
  position,
  visible,
  cannedResponseQuery = "",
  setSelectedCannedIndex,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      selectedIndex >= 0 &&
      containerRef.current &&
      containerRef.current.children[selectedIndex]
    ) {
      const selectedElement = containerRef.current.children[
        selectedIndex
      ] as HTMLDivElement;
      selectedElement.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);
  if (!visible || responses.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-8 z-50 w-[99%] bg-[f9fafb] mx-1">
      <div ref={containerRef} className="p-1 max-h-[110px] overflow-y-auto">
        {responses.map((response, index) => {
          return (
            <div
              id={`canned-response-${index}`}
              key={response.id}
              className={`p-1 cursor-pointer transition-colors flex items-center ${
                index === selectedIndex ? "bg-[#EDF7FF]" : "hover:bg-[#EDF7FF]"
              }`}
              onMouseEnter={() => setSelectedCannedIndex?.(index)}
              onClick={() => onSelect(response)}
            >
              <p className="text-xs text-gray-600 line-clamp-2 flex items-center gap-2">
                <span className="font-bold">
                  {cannedResponseQuery?.startsWith("@@")
                    ? highlightPrefixAndQuery(
                        `@@${response.category?.name || 'Unknown'}`,
                        cannedResponseQuery
                      )
                    : cannedResponseQuery?.startsWith("::")
                    ? highlightPrefixAndQuery(
                        `::${response.tags?.join(", ") || 'No tags'}`,
                        cannedResponseQuery
                      )
                    : cannedResponseQuery?.startsWith("/")
                    ? highlightPrefixAndQuery(
                        `/${response.shortcut || response.title.toLowerCase().replace(/\s+/g, '-')}`,
                        cannedResponseQuery
                      )
                    : String(response.shortcut)}
                </span>
                {highlightMatch(response.content, cannedResponseQuery)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// New function to highlight both prefix and query
function highlightPrefixAndQuery(text: string, query: string) {
  if (!query) return text;

  let prefix = "";
  let cleanQuery = "";
  
  if (query.startsWith("@@")) {
    prefix = "@@";
    cleanQuery = query.slice(2);
  } else if (query.startsWith("::")) {
    prefix = "::";
    cleanQuery = query.slice(2);
  } else if (query.startsWith("/")) {
    prefix = "/";
    cleanQuery = query.slice(1);
  } else {
    return text;
  }

  if (!cleanQuery) {
    // Only prefix, highlight the prefix
    return (
      <>
        <span className="text-[#337FBD] font-semibold">{prefix}</span>
        {text.slice(prefix.length)}
      </>
    );
  }

  // Find the query in the text (after the prefix)
  const textAfterPrefix = text.slice(prefix.length);
  const queryIndex = textAfterPrefix.toLowerCase().indexOf(cleanQuery.toLowerCase());
  
  if (queryIndex === -1) {
    // Query not found, just highlight prefix
    return (
      <>
        <span className="text-[#337FBD] font-semibold">{prefix}</span>
        {textAfterPrefix}
      </>
    );
  }

  // Highlight both prefix and query
  return (
    <>
      <span className="text-[#337FBD] font-semibold">{prefix}</span>
      {textAfterPrefix.substring(0, queryIndex)}
      <span className="text-[#337FBD] font-semibold">
        {textAfterPrefix.substring(queryIndex, queryIndex + cleanQuery.length)}
      </span>
      {textAfterPrefix.substring(queryIndex + cleanQuery.length)}
    </>
  );
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;

  // Remove prefix characters for matching
  let cleanQuery = query;
  if (query.startsWith("@@")) {
    cleanQuery = query.slice(2);
  } else if (query.startsWith("::")) {
    cleanQuery = query.slice(2);
  } else if (query.startsWith("/")) {
    cleanQuery = query.slice(1);
  }

  if (!cleanQuery) return text;

  const idx = text.toLowerCase().indexOf(cleanQuery.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      <span>
        {text.substring(0, idx)}
        <span className="text-[#337FBD] font-semibold">
          {text.substring(idx, idx + cleanQuery.length)}
        </span>
        {text.substring(idx + cleanQuery.length)}
      </span>
    </>
  );
}

export default CannedResponseDropdown;
