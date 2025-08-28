import {
  formatFileSize,
  handleDownload,
  handleOpenInNewTab,
} from "@/functions/files-functions";
import { useCallback, useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { getFileIcon } from "@/icons";
import { useFileEncryption } from "@/hooks/use-file-encryption";

const SITE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const FileAttachment = ({ msg }: { msg: MessageType }) => {
  const [sessionId, setSessionId] = useState("");

  // Initialize encryption session
  useEffect(() => {
    setSessionId(`widget_${Date.now()}`);
  }, []);

  const { getEncryptionTask } = useFileEncryption(sessionId);

  if (!msg.metadata?.attachment) {
    return null;
  }

  const attachment = useMemo(() => {
    const baseUrl = msg.metadata?.attachment.url;
    const isBase64 = baseUrl && baseUrl.startsWith('data:');
    
    return {
      fileName: msg.metadata?.attachment.fileName,
      mimeType: msg.metadata?.attachment.mimeType,
      previewUrl: isBase64 ? baseUrl : `${SITE_URL}${msg.metadata?.attachment.previewUrl}`,
      size: msg.metadata?.attachment.size,
      url: isBase64 ? baseUrl : `${SITE_URL}${msg.metadata?.attachment.url}`,
    };
  }, [msg.metadata?.attachment]);

  const isImage = attachment.mimeType.startsWith("image/");

  // Monitor encryption progress in background (console logging only)
  useEffect(() => {
    if (msg.metadata?.attachment?.encryptionTaskId) {
      const checkProgress = setInterval(() => {
        const task = getEncryptionTask(msg.metadata.attachment.encryptionTaskId);
        if (task) {
          if (task.status === "completed") {
            console.log(`[v0] File encryption completed for ${attachment.fileName}`);
            clearInterval(checkProgress);
          } else if (task.status === "error") {
            console.error(`[v0] File encryption failed for ${attachment.fileName}:`, task.error);
            clearInterval(checkProgress);
          }
        }
      }, 1000);

      return () => clearInterval(checkProgress);
    }
  }, [msg.metadata?.attachment?.encryptionTaskId, getEncryptionTask, attachment.fileName]);

  const openInNewTabHandler = useCallback(() => {
    handleOpenInNewTab(attachment);
  }, [attachment]);

  const downloadHandler = useCallback(() => {
    handleDownload(attachment);
  }, [attachment]);

  const fileIcon = useMemo(() => {
    if (isImage && attachment.url) {
      return (
        <img
          src={attachment.url}
          alt={attachment.fileName}
          className="w-12 h-12 object-cover rounded-sm border border-gray-200 cursor-pointer hover:border-gray-400 transition-colors duration-200"
          onClick={openInNewTabHandler}
          title="Click to open in new tab"
        />
      );
    }

    return (
      <div className="w-12 h-12 bg-gray-200 rounded-sm border border-gray-300 flex items-center justify-center">
        <span className="text-gray-500 text-xs font-medium">
          {getFileIcon(attachment.mimeType)}
        </span>
      </div>
    );
  }, [isImage, attachment.url, attachment.fileName, openInNewTabHandler]);

  const actionButtons = useMemo(() => {
    if (msg.isLoading) {
      return (
        <span className="text-xs text-gray-500 animate-pulse ml-auto">
          Uploading...
        </span>
      );
    }

    return (
      <div className="flex items-center gap-2 ml-auto">
        {isImage && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            onClick={openInNewTabHandler}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4 text-gray-600" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          onClick={downloadHandler}
          title="Download file"
        >
          <Download className="h-4 w-4 text-gray-600" />
        </Button>
      </div>
    );
  }, [msg.isLoading, isImage, openInNewTabHandler, downloadHandler]);

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border text-sm">
          <div className="flex items-center gap-3 flex-1">
            {fileIcon}
            <div className="flex flex-col flex-1">
              <span className="font-medium text-gray-900 truncate">
                {attachment.fileName}
              </span>
              <span className="text-xs text-gray-500">
                {formatFileSize(attachment)}
              </span>
            </div>
          </div>
          {actionButtons}
        </div>
      </div>
    </div>
  );
};

export default FileAttachment;
