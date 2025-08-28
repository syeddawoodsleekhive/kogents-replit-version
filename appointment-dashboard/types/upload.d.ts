type FileUploadStatus =
  | "initiating"
  | "initiated"
  | "uploading"
  | "completed"
  | "failed"
  | "cancelled";

interface UploadSessionRequest {
  workspaceId: string;
  uploaderType: "agent" | "visitor";
  sessionId: string;
  visitorId: string;
  agentId: string;
  roomId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileCategory: "image" | "document" | "video" | "audio" | "other";
  keyAlgorithm: string;
  contentAlgorithm: string;
  keyId: string;
  encryptedKey: string; // Base64 encoded encrypted key
  encryptionIv: string; // Base64 encoded IV
  encryptionTag: string; // Base64 encoded authentication tag
  ciphertextHash: string; // SHA-256 hash of the file content
}

interface UploadSessionResponse {
  sessionId: string;
  workspaceId: string;
  uploaderType: "agent" | "visitor";
  fileName: string;
  fileSize: number;
  mimeType: string;
  chunkSize: number;
  totalChunks: number;
  status: FileUploadStatus;
  expiresAt: string;
  batchId: string;
}

interface UploadDirectRequest {
  file: File;
  workspaceId: string;
  uploaderType: "agent" | "visitor";
  sessionId?: string;
  visitorId?: string;
  agentId?: string;
  roomId?: string;
  fileName: string;
  mimeType: string;
  encryptionIv?: string;
  encryptionTag?: string;
  keyId?: string;
  checksum?: string;
}

interface UploadSessionStatus {
  sessionId: string;
  status: FileUploadStatus;
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
    url: Record<string, any>;
    previewUrl: Record<string, any>;
  };
}

interface FileUploadStatusEvent {
  roomId?: string;
  messageId: string;
  uploadId?: string;
  status: FileUploadStatus;
  progress?: number;
  errorCode?: string;
  errorMessage?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sessionId?: string;
  status: FileUploadStatus;
  progress: number;
  errorMessage?: string;
  uploadId?: string;
  storageKey?: string;
  url?: Record<string, any>;
  previewUrl?: Record<string, any>;
  encryptionKey?: ArrayBuffer;
  keyId?: string;
}

interface FileUploadStatusEvent {
  roomId?: string;
  messageId: string;
  uploadId?: string;
  status: FileUploadStatus;
  progress?: number;
  errorCode?: string;
  errorMessage?: string;
}

interface UseFileUploadProps {
  roomId: string;
  onUploadError?: (fileId: string, error: string) => void;
  emitSocketEvent?: (event: string, payload: any) => void;
}

interface FileAttachment {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  previewUrl?: string;
  width?: number;
  height?: number;
}

interface FileMessage {
  roomId: string;
  messageId: string;
  attachment: FileAttachment;
  caption?: string;
  isInternal?: boolean;
  uploadId?: string;
}
