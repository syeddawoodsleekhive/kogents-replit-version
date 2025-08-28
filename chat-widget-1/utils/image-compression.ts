/**
 * Utility functions for image compression and optimization
 */

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const DEFAULT_QUALITY = 0.8; // Currently unused (kept for potential fallback use)

// Cache for compressed images and quality calculations
const imageCache = new Map<string, File>();
const qualityCache = new Map<number, number>();

/**
 * Web Worker code for image compression
 * Performs progressive chunk-based rendering for smoother UI updates
 */
const workerCode = `
self.onmessage = async (e) => {
  const { fileData, fileName, fileType, maxWidth, maxHeight, quality, chunkSize } = e.data;
  
  try {
    const img = new Image();
    img.src = fileData;
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Failed to load image"));
    });

    let width = img.width;
    let height = img.height;

    // Resize maintaining aspect ratio
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    // Progressive rendering in chunks
    const chunk = chunkSize || 100;
    const steps = Math.ceil(height / chunk);
    for (let i = 0; i < steps; i++) {
      const startY = i * chunk;
      const chunkHeight = Math.min(chunk, height - startY);
      ctx.drawImage(img, 0, startY, width, chunkHeight, 0, startY, width, chunkHeight);
      
      // Report progress (0–90%)
      const progress = ((i + 1) / steps) * 90;
      self.postMessage({ progress });

      // Short delay for UI responsiveness
      await new Promise(r => setTimeout(r, 10));
    }

    const mimeType = fileType === "image/png" ? "image/png" : "image/jpeg";
    const blob = await canvas.convertToBlob({ 
      type: mimeType, 
      quality: mimeType === "image/png" ? undefined : quality 
    });

    self.postMessage({ 
      blob, 
      fileName, 
      mimeType, 
      progress: 100 
    });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
}`;

/**
 * Compresses an image file with progressive animation updates
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    onProgress?: (progress: number) => void;
  } = {},
): Promise<File> {
  const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey)!;

  // Skip unsupported file types
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  const maxWidth = options.maxWidth || MAX_WIDTH;
  const maxHeight = options.maxHeight || MAX_HEIGHT;
  const quality = options.quality || getOptimalQuality(file.size);
  const onProgress = options.onProgress || (() => {});

  return new Promise((resolve, reject) => {
    try {
      const worker = new Worker(
        URL.createObjectURL(new Blob([workerCode], { type: "application/javascript" }))
      );
      
      const reader = new FileReader();
      reader.onload = (e) => {
        worker.postMessage({
          fileData: e.target?.result,
          fileName: file.name,
          fileType: file.type,
          maxWidth,
          maxHeight,
          quality,
          chunkSize: 100,
        });

        worker.onmessage = (e) => {
          const { blob, fileName, mimeType, progress, error } = e.data;
          if (error) {
            reject(new Error(error));
            worker.terminate();
            return;
          }
          if (progress !== undefined) onProgress(progress);
          if (blob) {
            const compressedFile = new File([blob], fileName, {
              type: mimeType,
              lastModified: Date.now(),
            });
            imageCache.set(cacheKey, compressedFile);
            worker.terminate();
            resolve(compressedFile);
          }
        };

        worker.onerror = () => {
          reject(new Error("Worker error"));
          worker.terminate();
        };
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
        worker.terminate();
      };

      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Determines optimal image quality based on file size
 */
export function getOptimalQuality(fileSize: number): number {
  if (qualityCache.has(fileSize)) return qualityCache.get(fileSize)!;

  let quality;
  if (fileSize > 5 * 1024 * 1024) quality = 0.6;
  else if (fileSize > 2 * 1024 * 1024) quality = 0.7;
  else if (fileSize > 1024 * 1024) quality = 0.8;
  else quality = 0.9;

  qualityCache.set(fileSize, quality);
  return quality;
}

/**
 * Formats file size into human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

/**
 * Calculates the compression ratio
 */
export function getCompressionRatio(originalSize: number, compressedSize: number): string {
  const ratio = ((originalSize - compressedSize) / originalSize) * 100;
  return ratio.toFixed(0) + "%";
}

// --- Image cache auto-cleanup ---
const MAX_CACHE_SIZE = 50;
setInterval(() => {
  if (imageCache.size > MAX_CACHE_SIZE) {
    const keys = Array.from(imageCache.keys()).slice(0, imageCache.size - MAX_CACHE_SIZE);
    keys.forEach((key) => imageCache.delete(key));
  }
}, 60000); // Runs every 1 minute
