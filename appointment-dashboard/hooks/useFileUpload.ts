import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  createBatchUpload,
  uploadChunk,
  completeUploadSession,
  createUploadSession,
  uploadFileDirect,
  cancelUpload,
  generateIdempotencyKey,
} from "@/api/v2/upload";
import {
  generateEncryptionKey,
  generateIV,
  arrayBufferToBase64,
  generateHash,
  encryptData,
  generateKeyId,
} from "@/utils/encryption";
import { addFileMessage, updateChatMessage } from "@/api/v2/chat";

export const useFileUpload = ({
  roomId,
  onUploadError,
  emitSocketEvent,
}: UseFileUploadProps) => {
  const { token, user, workspace } = useSelector(
    (state: RootReducerState) => state.user
  );
  const dispatch: AppReducerDispatch = useDispatch();

  const encodeFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to encode file"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = useCallback(
    async (file: File) => {
      if (!user?.id || !workspace?.id || !token) {
        throw new Error("User not authenticated");
      }

      const idempotencyKey = generateIdempotencyKey();

      try {
        // Generate encryption parameters
        const encryptionKey = generateEncryptionKey();
        const keyId = generateKeyId();

        // Encrypt the encryption key itself (for secure transmission)
        const keyEncryptionKey = generateEncryptionKey(); // Master key for encrypting file keys
        const {
          encryptedData: encryptedKey,
          iv: keyIv,
          tag: keyTag,
        } = await encryptData(encryptionKey, keyEncryptionKey);

        // Generate hash of the original file content
        const fileArrayBuffer = await file.arrayBuffer();
        const ciphertextHash = await generateHash(fileArrayBuffer);

        // Encode image as base64 for immediate display
        let previewUrl = "";
        if (file.type.startsWith("image/")) {
          try {
            previewUrl = await encodeFileAsBase64(file);
          } catch (error) {
            console.warn("Failed to encode image as base64:", error);
          }
        }

        const sessionRequest: UploadSessionRequest = {
          workspaceId: workspace.id,
          uploaderType: "agent",
          sessionId: idempotencyKey,
          visitorId: "",
          agentId: user.id,
          roomId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          fileCategory: file.type.startsWith("image/") ? "image" : "document",
          keyAlgorithm: "AES-256-GCM",
          contentAlgorithm: "AES-256-GCM",
          keyId: keyId,
          encryptedKey: arrayBufferToBase64(encryptedKey),
          encryptionIv: arrayBufferToBase64(keyIv),
          encryptionTag: arrayBufferToBase64(keyTag),
          ciphertextHash: ciphertextHash,
        };

        dispatch(
          addFileMessage({
            roomId,
            messageId: idempotencyKey,
            file,
            attachment: {
              fileName: file.name,
              mimeType: file.type,
              size: file.size,
              url: previewUrl,
              previewUrl: previewUrl,
              width: undefined,
              height: undefined,
            },
            senderId: user.id,
            senderName: user.name,
          })
        );

        const sessionResponse = await createUploadSession(
          sessionRequest,
          idempotencyKey
        );

        await uploadFileDirect(
          {
            file,
            workspaceId: workspace.id,
            uploaderType: "agent",
            sessionId: sessionResponse.sessionId,
            roomId,
            fileName: file.name,
            mimeType: file.type,
            encryptionIv: arrayBufferToBase64(keyIv),
            encryptionTag: arrayBufferToBase64(keyTag),
            keyId: keyId,
            checksum: ciphertextHash,
          },
          idempotencyKey,
          (progress) => {
            // Progress updates can be handled here if needed
          },
          (data) => {
            // Emit upload completion event
            if (emitSocketEvent) {
              const uploadStatusEvent: FileUploadStatusEvent = {
                roomId,
                messageId: idempotencyKey,
                uploadId: data.uploadId,
                status: "completed",
                progress: 100,
              };

              emitSocketEvent("file-upload-status", uploadStatusEvent);

              const fileMessage: FileMessage = {
                roomId,
                messageId: idempotencyKey,
                attachment: {
                  url: data.url,
                  fileName: data.fileName,
                  mimeType: data.mimeType,
                  size: data.size,
                  previewUrl: data.previewUrl || data.url,
                },
                uploadId: data.uploadId,
              };

              emitSocketEvent("file-message", fileMessage);
              dispatch(
                updateChatMessage({
                  roomId,
                  messageId: idempotencyKey,
                  updates: {
                    metadata: {
                      attachment: {
                        ...fileMessage.attachment,
                      },
                    },
                  },
                })
              );
            }
          }
        );
      } catch (error) {
        console.error("Upload error:", error);

        if (emitSocketEvent) {
          const uploadStatusEvent: FileUploadStatusEvent = {
            roomId,
            messageId: idempotencyKey,
            status: "failed",
            errorMessage:
              error instanceof Error ? error.message : "Upload failed",
          };

          emitSocketEvent("file-upload-status", uploadStatusEvent);
        }

        onUploadError?.(
          idempotencyKey,
          error instanceof Error ? error.message : "Upload failed"
        );
      }
    },
    [
      user?.id,
      workspace?.id,
      token,
      roomId,
      dispatch,
      onUploadError,
      emitSocketEvent,
    ]
  );

  // NEW: Add batch upload functionality
  const uploadFilesBatch = useCallback(
    async (files: File[]) => {
      if (!user?.id || !workspace?.id || !token) {
        throw new Error("User not authenticated");
      }

      if (files.length === 0) return;
      if (files.length > 5) {
        throw new Error("Maximum 5 files allowed per batch");
      }

      const batchIdempotencyKey = generateIdempotencyKey();

      try {
        // Step 1: Create batch
        const batchRequest = {
          workspaceId: workspace.id,
          uploaderType: "agent" as const,
          visitorId: "", // Will be filled from room details
          agentId: user.id,
          roomId,
          files: files.map(file => ({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          })),
        };

        const batchResponse = await createBatchUpload(batchRequest, batchIdempotencyKey);
        console.log("Batch created:", batchResponse);

        // Step 2: Process each file in the batch
        const uploadPromises = batchResponse.items.map(async (item, index) => {
          const file = files[index];
          const fileIdempotencyKey = `${batchIdempotencyKey}_${index}`;

          // Encode image as base64 for immediate display
          let previewUrl = "";
          if (file.type.startsWith("image/")) {
            try {
              previewUrl = await encodeFileAsBase64(file);
            } catch (error) {
              console.warn("Failed to encode image as base64:", error);
            }
          }

          // Add file message to Redux state immediately
          dispatch(
            addFileMessage({
              roomId,
              messageId: fileIdempotencyKey,
              file,
              attachment: {
                fileName: file.name,
                mimeType: file.type,
                size: file.size,
                url: previewUrl,
                previewUrl: previewUrl,
                width: undefined,
                height: undefined,
              },
              senderId: user.id,
              senderName: user.name,
            })
          );

          // Upload file in chunks
          await uploadFileInChunks(file, item, fileIdempotencyKey);
        });

        // Wait for all uploads to complete
        await Promise.all(uploadPromises);

      } catch (error) {
        console.error("Batch upload error:", error);
        throw error;
      }
    },
    [user?.id, workspace?.id, token, roomId, dispatch, emitSocketEvent]
  );

  // Helper function to upload a single file in chunks
  const uploadFileInChunks = async (
    file: File,
    item: any,
    fileIdempotencyKey: string
  ) => {
    const chunkSize = item.chunkSize;
    const totalChunks = item.totalChunks;
    const sessionId = item.sessionId;

    try {
      // Generate encryption parameters for this file
      const encryptionKey = generateEncryptionKey();
      const keyId = generateKeyId();
      const keyEncryptionKey = generateEncryptionKey();
      const {
        encryptedData: encryptedKeyData,
        iv: keyIv,
        tag: keyTag,
      } = await encryptData(encryptionKey, keyEncryptionKey);

      // Upload chunks sequentially
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkBlob = file.slice(start, end);

        // Generate checksum for the chunk
        const chunkArrayBuffer = await chunkBlob.arrayBuffer();
        const chunkChecksum = await generateHash(chunkArrayBuffer);

        const chunkRequest = {
          chunkIndex,
          totalChunks,
          chunk: chunkBlob,
          chunkChecksum,
          encryptionIv: arrayBufferToBase64(keyIv),
          encryptionTag: arrayBufferToBase64(keyTag),
          keyId,
        };

        const chunkResponse = await uploadChunk(sessionId, chunkRequest);
        console.log(`Chunk ${chunkIndex} uploaded:`, chunkResponse);

        // Emit progress update
        if (emitSocketEvent) {
          const uploadStatusEvent: FileUploadStatusEvent = {
            roomId,
            messageId: fileIdempotencyKey,
            status: "uploading",
            progress: chunkResponse.progress,
          };
          emitSocketEvent("file-upload-status", uploadStatusEvent);
        }
      }

      // Step 4: Complete upload session
      const finalChecksum = await generateHash(await file.arrayBuffer());
      const completeRequest = {
        totalChunks,
        mimeType: file.type,
        finalChecksum,
      };

      const completedDto = await completeUploadSession(sessionId, completeRequest);
      console.log("Upload completed:", completedDto);

      // Step 5: Send file message
      if (emitSocketEvent) {
        const fileMessage: FileMessage = {
          roomId,
          messageId: fileIdempotencyKey,
          attachment: {
            url: completedDto.url || "",
            fileName: file.name,
            mimeType: file.type,
            size: completedDto.size,
            previewUrl: completedDto.url || "",
          },
          uploadId: completedDto.storageKey,
        };

        emitSocketEvent("file-message", fileMessage);

        // Update Redux state with final URL
        dispatch(
          updateChatMessage({
            roomId,
            messageId: fileIdempotencyKey,
            updates: {
              metadata: {
                attachment: {
                  ...fileMessage.attachment,
                },
              },
              isLoading: false,
            },
          })
        );
      }

    } catch (error) {
      console.error(`Failed to upload file ${file.name}:`, error);
      
      // Emit error status
      if (emitSocketEvent) {
        const uploadStatusEvent: FileUploadStatusEvent = {
          roomId,
          messageId: fileIdempotencyKey,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Upload failed",
        };
        emitSocketEvent("file-upload-status", uploadStatusEvent);
      }

      onUploadError?.(
        fileIdempotencyKey,
        error instanceof Error ? error.message : "Upload failed"
      );
    }
  };

  return {
    uploadFile,        // Single file upload (existing functionality)
    uploadFilesBatch,  // Batch upload (new functionality)
  };
};
