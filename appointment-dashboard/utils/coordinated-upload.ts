// Utility to coordinate file uploads and prevent duplicate/uncoordinated requests

// Key is file name + size + type
const uploadLocks: Record<string, number> = {};

export async function coordinatedFileUpload(
  file: File,
  uploadFn: (file: File) => Promise<any>,
  debounceMs = 500
): Promise<any> {
  const key = `${file.name}_${file.size}_${file.type}`;
  const now = Date.now();

  // If a recent upload is in progress or just finished, skip
  if (uploadLocks[key] && now - uploadLocks[key] < debounceMs) {
    return Promise.reject(new Error("Upload throttled or already in progress"));
  }

  uploadLocks[key] = now;
  try {
    const result = await uploadFn(file);
    uploadLocks[key] = Date.now(); // update timestamp after upload
    return result;
  } finally {
    setTimeout(() => {
      delete uploadLocks[key];
    }, debounceMs);
  }
}
