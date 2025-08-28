import { useState, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { FileUploadManager } from "@/utils/file-upload";
import { setAddMessage, updateMessage } from "@/app/api/v2/chat";
import { FileMessage, FileUploadStatus } from "@/types/chat.v2";
import { generateMessageId } from "@/app/api/v2/functions";

interface UseFileUploadProps {
  workspaceId: string;
  sessionId: string;
  onUploadComplete?: (messageId: string, result: any) => void;
  onUploadError?: (messageId: string, error: string) => void;
  emitSocketEvent?: (event: string, data: any) => void;
}

export function useFileUpload({
  workspaceId,
  sessionId,
  onUploadComplete,
  onUploadError,
  emitSocketEvent,
}: UseFileUploadProps) {
  const dispatch: AppReducerDispatch = useDispatch();
  const uploadManagerRef = useRef<FileUploadManager | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  // Helper function to convert file to base64
  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }, []);

  const initializeUploadManager = useCallback(() => {
    if (!uploadManagerRef.current) {
      uploadManagerRef.current = new FileUploadManager(
        // onStatusUpdate
        (messageId: string, status: FileUploadStatus) => {
          // Update message with upload progress
          // You can implement progress updates here if needed
          console.log("Upload status update:", messageId, status);
        },
        // onComplete
        (messageId: string, result: any) => {
          // Mark message as delivered to server
          onUploadComplete?.(messageId, result);

          // Emit socket event with file message data
          if (emitSocketEvent && result) {
            const fileMessage = {
              messageId,
              attachment: {
                url: result.url,
                fileName: result.fileName,
                mimeType: result.mimeType,
                size: result.size,
                previewUrl: result.previewUrl || result.url,
              },
              uploadId: result.uploadId,
            };

            emitSocketEvent("file-message", fileMessage);
            dispatch(
              updateMessage(messageId, {
                metadata: {
                  attachment: {
                    ...fileMessage.attachment,
                  },
                },
              })
            );
          }
        },
        // onError
        (messageId: string, error: string) => {
          setUploadingFiles((prev) => {
            const newSet = new Set(prev);
            newSet.delete(messageId);
            return newSet;
          });
          onUploadError?.(messageId, error);
        }
      );
    }
  }, [dispatch, onUploadComplete, onUploadError, emitSocketEvent]);

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        initializeUploadManager();

        // Convert image files to base64 for immediate preview
        let previewUrl = "";
        let url = "";

        if (file.type.startsWith("image/")) {
          try {
            const base64Data = await convertFileToBase64(file);
            previewUrl = base64Data;
            url = base64Data;
          } catch (error) {
            console.warn("Failed to convert image to base64:", error);
            // Fallback to empty strings if conversion fails
          }
        }

        // Create file message and add to Redux state
        const fileMessage: FileMessage = {
          messageId: sessionId,
          content: "",
          messageType: "file",
          roomId: sessionId, // Use sessionId as roomId
          senderId: sessionId, // Use sessionId as senderId
          senderType: "visitor",
          createdAt: new Date(),
          isLoading: true,
          uploadProgress: 0,
          uploadStatus: "initiated",
          file: {
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
          },
        };

        dispatch(
          setAddMessage({
            ...fileMessage,
            metadata: {
              attachment: {
                fileName: file.name,
                mimeType: file.type,
                size: file.size,
                previewUrl: previewUrl,
                url: url,
                isBase64: file.type.startsWith("image/") && !!previewUrl,
              },
            },
          })
        );
        setUploadingFiles((prev) => new Set(prev).add(sessionId));

        console.log("Starting file upload for:", file.name);

        // Create upload session
        const uploadSession =
          await uploadManagerRef.current!.createUploadSession(
            file,
            workspaceId,
            sessionId
          );

        // Start file upload
        await uploadManagerRef.current!.uploadFile(
          file,
          uploadSession,
          workspaceId,
          sessionId
        );

        return sessionId;
      } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
      }
    },
    [
      workspaceId,
      sessionId,
      dispatch,
      initializeUploadManager,
      convertFileToBase64,
    ]
  );

  const cancelUpload = useCallback(async (messageId: string) => {
    try {
      if (uploadManagerRef.current) {
        // Find the session ID for this message
        // You might need to store this mapping somewhere
        // For now, we'll need to implement a way to track messageId -> sessionId
        await uploadManagerRef.current.cancelUpload(messageId);

        setUploadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
      }
    } catch (error) {
      console.error("Error canceling upload:", error);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (uploadManagerRef.current) {
      uploadManagerRef.current.destroy();
      uploadManagerRef.current = null;
    }
  }, []);

  return {
    uploadFile,
    cancelUpload,
    uploadingFiles,
    cleanup,
  };
}
