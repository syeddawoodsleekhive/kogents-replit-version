export interface FileUploadSession {
  sessionId: string;
  workspaceId: string;
  uploaderType: "visitor" | "agent";
  fileName: string;
  fileSize: number;
  mimeType: string;
  chunkSize: number;
  totalChunks: number;
  status: "initiated" | "uploading" | "completed" | "failed";
  expiresAt: string;
  batchId: string;
}

export interface FileUploadStatus {
  sessionId: string;
  status: "initiated" | "uploading" | "completed" | "failed";
  uploadedChunks: number;
  totalChunks: number;
  progress: number;
  file: {
    fileName: string;
    mimeType: string;
    size: number;
  };
  errorCode?: string;
  errorMessage?: string;
  result?: {
    uploadId: string;
    storageKey: string;
    url: any;
    previewUrl: any;
  };
}

export interface FileUploadPayload {
  workspaceId: string;
  uploaderType: "visitor" | "agent";
  sessionId: string;
  visitorId?: string;
  agentId?: string;
  roomId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileCategory: "image" | "document" | "video" | "audio";
  keyAlgorithm: string;
  contentAlgorithm: string;
  keyId: string;
  encryptedKey: string;
  encryptionIv: string;
  encryptionTag: string;
  ciphertextHash: string;
}

export interface FileUploadDirectPayload {
  file: File;
  workspaceId: string;
  uploaderType: "visitor" | "agent";
  sessionId?: string;
  visitorId?: string;
  agentId?: string;
  roomId?: string;
  fileName: string;
  mimeType: string;
  encryptionIv?: string;
  encryptionTag?: string;
  keyId?: string;
  checksum: string;
}

export interface FileUploadStatusEvent {
  roomId?: string;
  messageId: string;
  uploadId?: string;
  status: "initiated" | "uploading" | "completed" | "failed";
  progress?: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface FileMessage extends MessagesType {
  messageType: "file";
  file: {
    fileName: string;
    mimeType: string;
    size: number;
    url?: string;
    previewUrl?: string;
    uploadId?: string;
  };
  isLoading?: boolean;
  uploadProgress?: number;
  uploadStatus?: "initiated" | "uploading" | "completed" | "failed";
}
