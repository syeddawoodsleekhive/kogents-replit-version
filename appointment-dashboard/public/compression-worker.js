// Web Worker for Image Compression
// Enhanced for parallel processing, animated WebP preservation, and optional format conversion

// Network quality presets (duplicated from main thread)
const NETWORK_QUALITY_PRESETS = {
  high: {
    quality: 0.9,
    format: "webp",
    maxWidth: 1920,
    maxHeight: 1920,
  },
  medium: {
    quality: 0.8,
    format: "webp",
    maxWidth: 1200,
    maxHeight: 1200,
  },
  low: {
    quality: 0.6,
    format: "jpeg",
    maxWidth: 800,
    maxHeight: 800,
  },
  unknown: {
    quality: 0.8,
    format: "webp",
    maxWidth: 1200,
    maxHeight: 1200,
  },
}

const DEFAULT_SETTINGS = {
  format: "auto",
  quality: 0.8,
  lossless: false,
  progressive: true,
  maxWidth: 1200,
  maxHeight: 1200,
  preserveMetadata: false,
}

// Check if OffscreenCanvas is supported
const supportsOffscreenCanvas = typeof OffscreenCanvas !== "undefined"

// Track active tasks for better parallel processing
const activeTasks = new Map()

// Get adaptive settings based on network quality
function getAdaptiveSettings(networkQuality, userSettings = {}) {
  const networkPreset = NETWORK_QUALITY_PRESETS[networkQuality] || NETWORK_QUALITY_PRESETS.unknown
  return {
    ...DEFAULT_SETTINGS,
    ...networkPreset,
    ...userSettings,
  }
}

// Determine the best format for compression (mirrors main thread)
function determineBestFormat(fileType, settings, formatSupport) {
  if (settings.format !== "auto") {
    return settings.format
  }

  const type = fileType.toLowerCase()

  // For lossless compression, prefer PNG or WebP lossless
  if (settings.lossless) {
    return formatSupport.webp ? "webp" : "png"
  }

  // For photos, prefer modern formats (includes HEIC/HEIF/TIFF if decodable)
  if (
    type.includes("jpeg") ||
    type.includes("jpg") ||
    type.includes("heic") ||
    type.includes("heif") ||
    type.includes("tiff")
  ) {
    if (formatSupport.avif) return "avif"
    if (formatSupport.webp) return "webp"
    return "jpeg"
  }

  // For graphics/screenshots, prefer WebP or PNG
  if (type.includes("png") || type.includes("svg") || type.includes("bmp") || type.includes("ico")) {
    return formatSupport.webp ? "webp" : "png"
  }

  // Default fallback
  return formatSupport.webp ? "webp" : "jpeg"
}

// Animated WebP detection
function isAnimatedWebPBuffer(buffer) {
  const view = new DataView(buffer)
  const len = view.byteLength
  if (len < 16) return false

  if (getFourCC(view, 0) !== "RIFF" || getFourCC(view, 8) !== "WEBP") {
    return false
  }

  let offset = 12
  while (offset + 8 <= len) {
    const chunkId = getFourCC(view, offset)
    const chunkSize = view.getUint32(offset + 4, true)
    const next = offset + 8 + chunkSize + (chunkSize % 2)

    if (chunkId === "VP8X") {
      const flags = view.getUint8(offset + 8)
      if ((flags & 0x02) !== 0) return true
    }
    if (chunkId === "ANIM" || chunkId === "ANMF") {
      return true
    }

    offset = next
  }
  return false
}

function getFourCC(view, offset) {
  if (offset + 4 > view.byteLength) return ""
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  )
}

// Compress image using regular Canvas as fallback
async function compressWithCanvas(imageData, settings, formatSupport, originalFile) {
  const { width, height, data } = imageData
  const targetFormat = determineBestFormat(originalFile.type, settings, formatSupport)

  // Calculate new dimensions
  let newWidth = width
  let newHeight = height
  const aspectRatio = width / height

  if (newWidth > settings.maxWidth) {
    newWidth = settings.maxWidth
    newHeight = newWidth / aspectRatio
  }

  if (newHeight > settings.maxHeight) {
    newHeight = settings.maxHeight
    newWidth = newHeight * aspectRatio
  }

  // Create a temporary canvas element
  const canvas = document.createElement('canvas')
  canvas.width = newWidth
  canvas.height = newHeight
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error("Could not get Canvas context")
  }

  // Create a temporary canvas for the source image
  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = width
  sourceCanvas.height = height
  const sourceCtx = sourceCanvas.getContext('2d')
  
  // Create ImageData and put it on source canvas
  const sourceImageData = new ImageData(data, width, height)
  sourceCtx.putImageData(sourceImageData, 0, 0)

  // Set image smoothing for better quality
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Draw resized image
  ctx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight)

  // Convert to target format
  const mimeType = `image/${targetFormat}`
  const quality = settings.lossless ? undefined : settings.quality

  // Convert to blob using canvas.toBlob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob from canvas'))
        }
      },
      mimeType,
      quality
    )
  })
}

// Compress image using OffscreenCanvas (if supported)
async function compressWithOffscreenCanvas(imageData, settings, formatSupport, originalFile) {
  const { width, height, data } = imageData
  const targetFormat = determineBestFormat(originalFile.type, settings, formatSupport)

  // Calculate new dimensions
  let newWidth = width
  let newHeight = height
  const aspectRatio = width / height

  if (newWidth > settings.maxWidth) {
    newWidth = settings.maxWidth
    newHeight = newWidth / aspectRatio
  }

  if (newHeight > settings.maxHeight) {
    newHeight = settings.maxHeight
    newWidth = newHeight * aspectRatio
  }

  // Create OffscreenCanvas
  const canvas = new OffscreenCanvas(newWidth, newHeight)
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Could not get OffscreenCanvas context")
  }

  // Create ImageData and put it on canvas
  const sourceCanvas = new OffscreenCanvas(width, height)
  const sourceCtx = sourceCanvas.getContext("2d")
  const sourceImageData = new ImageData(data, width, height)
  sourceCtx.putImageData(sourceImageData, 0, 0)

  // Set image smoothing for better quality
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  // Draw resized image
  ctx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight)

  // Convert to target format
  const mimeType = `image/${targetFormat}`
  const quality = settings.lossless ? undefined : settings.quality

  // Convert to blob
  const blob = await canvas.convertToBlob({
    type: mimeType,
    quality: quality,
  })

  return blob
}

// Main compression function with enhanced parallel processing support
async function compressImage(file, settings, formatSupport, taskId, onProgress) {
  const startTime = performance.now()
  const originalSize = file.size
  const type = file.type.toLowerCase()

  console.log(`[Worker] Starting compression for ${file.name} (${type}, ${originalSize} bytes)`)

  // Skip non-image files
  if (!type.startsWith("image/")) {
    console.log(`[Worker] Skipping non-image file: ${file.name}`)
    const arrayBuffer = await file.arrayBuffer()
    return {
      arrayBuffer,
      fileName: file.name,
      fileType: file.type,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      format: file.type,
      quality: 1,
      processingTime: 0,
    }
  }

  // Preserve GIF and animated WebP
  if (type.includes("gif")) {
    console.log(`[Worker] Preserving GIF: ${file.name}`)
    const arrayBuffer = await file.arrayBuffer()
    return {
      arrayBuffer,
      fileName: file.name,
      fileType: file.type,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      format: file.type,
      quality: 1,
      processingTime: 0,
    }
  }
  
  if (type.includes("webp")) {
    // Read a small slice to detect animation
    const slice = file.slice(0, Math.min(file.size, 1024 * 256))
    const buf = await slice.arrayBuffer()
    if (isAnimatedWebPBuffer(buf)) {
      console.log(`[Worker] Preserving animated WebP: ${file.name}`)
      const arrayBuffer = await file.arrayBuffer()
      return {
        arrayBuffer,
        fileName: file.name,
        fileType: file.type,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 0,
        format: file.type,
        quality: 1,
        processingTime: 0,
      }
    }
  }

  onProgress?.(10)

  try {
    onProgress?.(30)

    // Try to decode using createImageBitmap (optional conversion for decodable formats)
    const imageBitmap = await createImageBitmap(file)
    console.log(`[Worker] Image decoded: ${imageBitmap.width}x${imageBitmap.height}`)

    onProgress?.(50)

    // Extract image data
    let imageData
    if (supportsOffscreenCanvas) {
      // Use OffscreenCanvas if supported
      const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height)
      const ctx = canvas.getContext("2d")
      ctx.drawImage(imageBitmap, 0, 0)
      imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height)
    } else {
      // Fallback to regular Canvas
      const canvas = document.createElement('canvas')
      canvas.width = imageBitmap.width
      canvas.height = imageBitmap.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(imageBitmap, 0, 0)
      imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height)
    }

    onProgress?.(70)

    // Compress/convert the image using appropriate method
    let compressedBlob
    if (supportsOffscreenCanvas) {
      compressedBlob = await compressWithOffscreenCanvas(imageData, settings, formatSupport, file)
    } else {
      compressedBlob = await compressWithCanvas(imageData, settings, formatSupport, file)
    }
    console.log(`[Worker] Compression complete: ${compressedBlob.size} bytes`)

    onProgress?.(90)

    // Convert blob to ArrayBuffer for transfer
    const arrayBuffer = await compressedBlob.arrayBuffer()

    const compressedSize = compressedBlob.size
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100
    const processingTime = performance.now() - startTime
    const targetFormat = determineBestFormat(file.type, settings, formatSupport)

    console.log(`[Worker] Final result: ${originalSize} -> ${compressedSize} bytes (${compressionRatio.toFixed(1)}% reduction)`)

    onProgress?.(100)

    return {
      arrayBuffer,
      fileName: file.name,
      fileType: `image/${targetFormat}`,
      originalSize,
      compressedSize,
      compressionRatio,
      format: targetFormat,
      quality: settings.quality,
      processingTime,
    }
  } catch (error) {
    console.error(`[Worker] Compression failed for ${file.name}:`, error)
    // If decoding/conversion fails (e.g., HEIC not decodable), return original file
    const arrayBuffer = await file.arrayBuffer()
    return {
      arrayBuffer,
      fileName: file.name,
      fileType: file.type,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      format: file.type,
      quality: 1,
      processingTime: performance.now() - startTime,
      error: error.message,
    }
  }
}

// Handle messages from main thread with enhanced parallel processing
self.onmessage = async (e) => {
  const { type, id, file, settings, networkQuality, formatSupport } = e.data

  console.log(`[Worker] Received message:`, { type, id, fileName: file?.name, fileSize: file?.size })

  if (type === "compress") {
    if (!file) {
      console.error(`[Worker] No file provided for task ${id}`)
      self.postMessage({
        type: "error",
        taskId: id, // Changed from 'id' to 'taskId'
        error: "No file provided",
      })
      return
    }

    activeTasks.set(id, { fileName: file.name, startTime: performance.now() })

    try {
      // Get adaptive settings
      const adaptiveSettings = getAdaptiveSettings(networkQuality, settings)
      console.log(`[Worker] Using settings:`, adaptiveSettings)

      // Compress the image
      const result = await compressImage(file, adaptiveSettings, formatSupport, id, (progress) => {
        // Send progress updates
        self.postMessage({
          type: "progress",
          taskId: id, // Changed from 'id' to 'taskId'
          progress,
        })
      })

      // Remove from active tasks
      activeTasks.delete(id)

      // Convert ArrayBuffer to Blob for the main thread
      const blob = new Blob([result.arrayBuffer], { type: result.fileType })
      
      console.log(`[Worker] Sending result for ${file.name}:`, {
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio
      })
      
      // Send result back to main thread with the blob
      self.postMessage(
        {
          type: "complete",
          taskId: id, // Changed from 'id' to 'taskId' to match hook expectations
          blob: blob,
          fileName: file.name,
          outputFormat: result.fileType,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          compressionRatio: result.compressionRatio,
        },
        [result.arrayBuffer], // Transfer ArrayBuffer ownership
      )
    } catch (error) {
      console.error(`[Worker] Error compressing ${file.name}:`, error)
      activeTasks.delete(id)
      self.postMessage({
        type: "error",
        taskId: id, // Changed from 'id' to 'taskId'
        error: error.message,
      })
    }
  }
}

// Handle worker errors
self.onerror = (error) => {
  activeTasks.clear()
  self.postMessage({
    type: "error",
    error: error.message,
  })
}
