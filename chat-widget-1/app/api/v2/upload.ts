import Axios from "@/lib/axios";

export const fileUploadAPI = {
  // Step 1: Create upload session
  createUploadSession: async (payload: any, idempotencyKey: string) => {
    const response = await Axios.post("/chat/uploads/sessions", payload, {
      headers: {
        "x-idempotency-key": idempotencyKey,
        "idempotency-key": idempotencyKey,
      },
    });
    return response.data;
  },

  // Step 2: Upload file directly
  uploadFileDirect: async (
    payload: any,
    idempotencyKey: string,
  ) => {
    const formData = new FormData();

    // Add file
    formData.append("file", payload.file);

    // Add other fields
    Object.entries(payload).forEach(([key, value]) => {
      if (key !== "file" && value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const response = await Axios.post("/chat/uploads/direct", formData, {
      headers: {
        "x-idempotency-key": idempotencyKey,
        "idempotency-key": idempotencyKey,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // Step 3: Get upload status
  getUploadStatus: async (sessionId: string) => {
    const response = await Axios.get(`/chat/uploads/sessions/${sessionId}`);
    return response.data;
  },

  // Step 4: Cancel upload
  cancelUpload: async (sessionId: string) => {
    const response = await Axios.delete(`/chat/uploads/sessions/${sessionId}`);
    return response.data;
  },
};
