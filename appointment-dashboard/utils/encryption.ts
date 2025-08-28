// Generate a random encryption key
export const generateEncryptionKey = (): ArrayBuffer => {
  return crypto.getRandomValues(new Uint8Array(32)).buffer;
};

// Generate a random IV (Initialization Vector)
export const generateIV = (): ArrayBuffer => {
  return crypto.getRandomValues(new Uint8Array(12)).buffer;
};

// Convert ArrayBuffer to base64 string
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Convert base64 string to ArrayBuffer
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Generate SHA-256 hash of data
export const generateHash = async (data: ArrayBuffer): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return arrayBufferToBase64(hashBuffer);
};

// Encrypt data using AES-GCM
export const encryptData = async (
  data: ArrayBuffer,
  key: ArrayBuffer
): Promise<{
  encryptedData: ArrayBuffer;
  iv: ArrayBuffer;
  tag: ArrayBuffer;
}> => {
  const iv = generateIV();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    data
  );

  // Extract the tag from the encrypted data
  const tag = encryptedData.slice(-16); // Last 16 bytes are the tag
  const ciphertext = encryptedData.slice(0, -16); // Rest is the ciphertext

  return {
    encryptedData: ciphertext,
    iv,
    tag,
  };
};

// Generate a unique key ID
export const generateKeyId = (): string => {
  return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
