import { useEffect, useCallback } from "react";

interface UseClipboardProps {
  onFilePaste: (files: File[]) => void;
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const useClipboard = ({
  onFilePaste,
  textAreaRef,
}: UseClipboardProps) => {
  const handleGlobalPaste = useCallback(
    async (e: ClipboardEvent) => {
      if (
        !textAreaRef.current?.contains(e.target as Node) &&
        !(e.target as Element)?.closest?.(".chat-area")
      ) {
        return;
      }

      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        console.log("Files found in clipboard:", e.clipboardData.files);
        const files = Array.from(e.clipboardData.files);
        e.preventDefault();
        await onFilePaste(files);
        return;
      }

      if (e.clipboardData?.items && e.clipboardData.items.length > 0) {
        const files: File[] = [];

        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];

          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file && file.size > 0) {
              console.log(
                "File extracted from clipboard:",
                file.name,
                file.size,
                file.type
              );
              files.push(file);
            }
          }
        }

        if (files.length > 0) {
          e.preventDefault();
          await onFilePaste(files);
          return;
        }
      }
    },
    [onFilePaste, textAreaRef]
  );

  useEffect(() => {
    document.addEventListener("paste", handleGlobalPaste);

    return () => {
      document.removeEventListener("paste", handleGlobalPaste);
    };
  }, [handleGlobalPaste]);
};
