import { fileUploadAPI } from "@/app/api/v2/upload";
import { generateMessageId } from "@/app/api/v2/functions";
import {
  FileUploadPayload,
  FileUploadDirectPayload,
  FileUploadStatus,
  FileMessage,
} from "@/types/chat.v2";

export class FileUploadManager {
  private uploadSessions = new Map<string, FileUploadStatus>();
  private uploadIntervals = new Map<string, NodeJS.Timeout>();
  private onStatusUpdate?: (
    messageId: string,
    status: FileUploadStatus
  ) => void;
  private onComplete?: (messageId: string, result: any) => void;
  private onError?: (messageId: string, error: string) => void;

  constructor(
    onStatusUpdate?: (messageId: string, status: FileUploadStatus) => void,
    onComplete?: (messageId: string, result: any) => void,
    onError?: (messageId: string, error: string) => void
  ) {
    this.onStatusUpdate = onStatusUpdate;
    this.onComplete = onComplete;
    this.onError = onError;
  }

  // Step 1: Create upload session
  async createUploadSession(
    file: File,
    workspaceId: string,
    sessionId: string
  ): Promise<FileUploadStatus> {
    try {
      // Generate encryption keys (you'll need to implement this based on your encryption requirements)
      const encryptionData = await this.generateEncryptionData(file);

      const payload: FileUploadPayload = {
        workspaceId,
        uploaderType: "visitor",
        sessionId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileCategory: this.getFileCategory(file.type),
        ...encryptionData,
      };

      const idempotencyKey = this.generateIdempotencyKey();
      console.log("Creating upload session with payload:", payload);
      const response = await fileUploadAPI.createUploadSession(
        payload,
        idempotencyKey
      );

      // Store session temporarily
      this.uploadSessions.set(response.sessionId, response);

      return response;
    } catch (error) {
      console.error("Error creating upload session:", error);
      throw error;
    }
  }

  // Step 2: Upload file
  async uploadFile(
    file: File,
    uploadSession: FileUploadStatus,
    workspaceId: string,
    sessionId: string
  ): Promise<void> {
    try {
      const payload: FileUploadDirectPayload = {
        file,
        workspaceId,
        uploaderType: "visitor",
        sessionId,
        fileName: file.name,
        mimeType: file.type,
        checksum: await this.calculateChecksum(file),
      };

      const idempotencyKey = this.generateIdempotencyKey();
      console.log("Uploading file with payload:", payload);
      const response = await fileUploadAPI.uploadFileDirect(
        payload,
        idempotencyKey
      );

      this.onComplete?.(sessionId, response);

      // Start polling for status
      // this.startStatusPolling(uploadSession.sessionId);
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  // Step 3: Poll upload status
  private startStatusPolling(sessionId: string): void {
    const interval = setInterval(async () => {
      try {
        const status = await fileUploadAPI.getUploadStatus(sessionId);
        this.uploadSessions.set(sessionId, status);

        if (this.onStatusUpdate) {
          this.onStatusUpdate(sessionId, status);
        }

        if (status.status === "completed") {
          this.stopStatusPolling(sessionId);
          if (this.onComplete) {
            this.onComplete(sessionId, status.result);
          }
        } else if (status.status === "failed") {
          this.stopStatusPolling(sessionId);
          if (this.onError) {
            this.onError(sessionId, status.errorMessage || "Upload failed");
          }
        }
      } catch (error) {
        console.error("Error polling upload status:", error);
      }
    }, 1000); // Poll every second

    this.uploadIntervals.set(sessionId, interval);
  }

  private stopStatusPolling(sessionId: string): void {
    const interval = this.uploadIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.uploadIntervals.delete(sessionId);
    }
  }

  // Step 4: Cancel upload
  async cancelUpload(sessionId: string): Promise<void> {
    try {
      await fileUploadAPI.cancelUpload(sessionId);
      this.stopStatusPolling(sessionId);
      this.uploadSessions.delete(sessionId);
    } catch (error) {
      console.error("Error canceling upload:", error);
      throw error;
    }
  }

  // Helper methods
  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async calculateChecksum(file: File): Promise<string> {
    // Implement checksum calculation (e.g., SHA-256)
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  private getFileCategory(
    mimeType: string
  ): "image" | "document" | "video" | "audio" {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    return "document";
  }

  private async generateEncryptionData(file: File): Promise<{
    keyAlgorithm: string;
    contentAlgorithm: string;
    keyId: string;
    encryptedKey: string;
    encryptionIv: string;
    encryptionTag: string;
    ciphertextHash: string;
  }> {
    // Implement your encryption logic here
    // This is a placeholder - you'll need to implement based on your encryption requirements
    return {
      keyAlgorithm: "AES-256-GCM",
      contentAlgorithm: "AES-256-GCM",
      keyId: "key-" + Date.now(),
      encryptedKey: "encrypted-key-placeholder",
      encryptionIv: "iv-placeholder",
      encryptionTag: "tag-placeholder",
      ciphertextHash: "hash-placeholder",
    };
  }

  // Cleanup
  destroy(): void {
    this.uploadIntervals.forEach((interval) => clearInterval(interval));
    this.uploadIntervals.clear();
    this.uploadSessions.clear();
  }
}
