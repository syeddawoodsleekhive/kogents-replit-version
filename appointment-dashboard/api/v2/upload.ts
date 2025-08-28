import Axios from "@/lib/axios";

export const generateIdempotencyKey = () => {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// New interfaces for batch uploads
export interface BatchUploadRequest {
  workspaceId: string;
  uploaderType: "agent" | "visitor";
  sessionId?: string;
  visitorId: string;
  agentId: string;
  roomId: string;
  files: Array<{
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
}

export interface BatchUploadResponse {
  batchId: string;
  defaultChunkSize: number;
  items: Array<{
    sessionId: string;
    chunkSize: number;
    totalChunks: number;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
}

export interface ChunkUploadRequest {
  chunkIndex: number;
  totalChunks: number;
  chunk: Blob;
  chunkChecksum?: string;
  encryptionIv?: string;
  encryptionTag?: string;
  keyId?: string;
}

export interface ChunkUploadResponse {
  uploadedChunks: number;
  totalChunks: number;
  nextChunkIndex: number;
  progress: number;
}

export interface UploadCompleteRequest {
  totalChunks: number;
  mimeType?: string;
  finalChecksum?: string;
}

export interface UploadCompletedDto {
  storageKey: string;
  url?: string;
  size: number;
  status: "processing";
  processingJobId: string;
}

// Create batch upload
export const createBatchUpload = async (
  payload: BatchUploadRequest,
  idempotencyKey: string
): Promise<BatchUploadResponse> => {
  const response = await Axios.post("/chat/uploads/batches", payload, {
    headers: {
      "x-idempotency-key": idempotencyKey,
    },
  });
  return response.data;
};

// Upload chunk
export const uploadChunk = async (
  sessionId: string,
  payload: ChunkUploadRequest
): Promise<ChunkUploadResponse> => {
  const formData = new FormData();
  formData.append("chunkIndex", payload.chunkIndex.toString());
  formData.append("totalChunks", payload.totalChunks.toString());
  formData.append("chunk", payload.chunk);
  
  if (payload.chunkChecksum) formData.append("chunkChecksum", payload.chunkChecksum);
  if (payload.encryptionIv) formData.append("encryptionIv", payload.encryptionIv);
  if (payload.encryptionTag) formData.append("encryptionTag", payload.encryptionTag);
  if (payload.keyId) formData.append("keyId", payload.keyId);

  const chunkIdempotencyKey = `${sessionId}:${payload.chunkIndex}`;
  
  const response = await Axios.post(
    `/chat/uploads/sessions/${sessionId}/chunks`,
    formData,
    {
      headers: {
        "x-chunk-idempotency-key": chunkIdempotencyKey,
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Complete upload session
export const completeUploadSession = async (
  sessionId: string,
  payload: UploadCompleteRequest
): Promise<UploadCompletedDto> => {
  const response = await Axios.post(
    `/chat/uploads/sessions/${sessionId}/complete`,
    payload
  );
  return response.data;
};

// Get batch status
export const getBatchStatus = async (
  batchId: string,
  includeItems: boolean = false
): Promise<any> => {
  const response = await Axios.get(`/chat/uploads/batches/${batchId}`, {
    params: { includeItems },
  });
  return response.data;
};

export const createUploadSession = async (
  payload: UploadSessionRequest,
  idempotencyKey: string
): Promise<UploadSessionResponse> => {
  const response = await Axios.post("/chat/uploads/sessions", payload, {
    headers: {
      "x-idempotency-key": idempotencyKey,
      "idempotency-key": idempotencyKey,
    },
  });
  return response.data;
};

export const uploadFileDirect = async (
  payload: UploadDirectRequest,
  idempotencyKey: string,
  onProgress?: (progress: number) => void,
  onUploadComplete?: (data: any) => void
): Promise<any> => {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("workspaceId", payload.workspaceId);
  formData.append("uploaderType", payload.uploaderType);

  if (payload.sessionId) formData.append("sessionId", payload.sessionId);
  if (payload.visitorId) formData.append("visitorId", payload.visitorId);
  if (payload.agentId) formData.append("agentId", payload.agentId);
  if (payload.roomId) formData.append("roomId", payload.roomId);
  if (payload.fileName) formData.append("fileName", payload.fileName);
  if (payload.mimeType) formData.append("mimeType", payload.mimeType);
  if (payload.encryptionIv)
    formData.append("encryptionIv", payload.encryptionIv);
  if (payload.encryptionTag)
    formData.append("encryptionTag", payload.encryptionTag);
  if (payload.keyId) formData.append("keyId", payload.keyId);
  if (payload.checksum) formData.append("checksum", payload.checksum);

  const response = await Axios.post("/chat/uploads/direct", formData, {
    headers: {
      "x-idempotency-key": `${idempotencyKey}-direct`,
      "idempotency-key": `${idempotencyKey}-direct`,
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(progress);
      }
    },
  });

  if (response.status === 201) onUploadComplete?.(response.data);

  return response.data;
};

export const getUploadSessionStatus = async (
  sessionId: string
): Promise<UploadSessionStatus> => {
  const response = await Axios.get(`/chat/uploads/sessions/${sessionId}`);
  return response.data;
};

export const cancelUpload = async (sessionId: string): Promise<void> => {
  await Axios.delete(`/chat/uploads/sessions/${sessionId}`);
};
