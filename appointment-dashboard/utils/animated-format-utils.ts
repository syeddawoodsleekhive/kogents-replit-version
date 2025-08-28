/**
 * Enhanced Animated Format Detection and Messaging Utilities
 * Provides comprehensive animation detection, frame analysis, and user messaging
 */

export interface AnimationInfo {
  isAnimated: boolean
  format: "gif" | "webp" | "apng" | "static"
  frameCount?: number
  duration?: number
  loopCount?: number
  canPreview: boolean
  willLoseAnimation: boolean
  message: string
  recommendation?: string
}

export interface AnimationDetectionResult {
  isAnimated: boolean
  animationInfo: AnimationInfo
  userMessage: string
  warningLevel: "info" | "warning" | "error"
}

/**
 * Enhanced animated format detection with frame counting and duration analysis
 */
export async function detectAnimatedFormatEnhanced(file: File): Promise<AnimationDetectionResult> {
  if (!["image/gif", "image/webp", "image/png"].includes(file.type)) {
    return {
      isAnimated: false,
      animationInfo: {
        isAnimated: false,
        format: "static",
        canPreview: true,
        willLoseAnimation: false,
        message: "Static image - no animation detected",
      },
      userMessage: "Static image will be processed normally",
      warningLevel: "info",
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      if (!arrayBuffer) {
        resolve(createStaticResult())
        return
      }

      const uint8Array = new Uint8Array(arrayBuffer)

      if (file.type === "image/gif") {
        const gifInfo = analyzeGIF(uint8Array)
        resolve(createGIFResult(gifInfo))
      } else if (file.type === "image/webp") {
        const webpInfo = analyzeWebP(uint8Array)
        resolve(createWebPResult(webpInfo))
      } else if (file.type === "image/png") {
        const apngInfo = analyzeAPNG(uint8Array)
        resolve(createAPNGResult(apngInfo))
      } else {
        resolve(createStaticResult())
      }
    }

    reader.onerror = () => resolve(createStaticResult())
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Analyze GIF for animation properties
 */
function analyzeGIF(data: Uint8Array): Partial<AnimationInfo> {
  // Check GIF signature
  const signature = String.fromCharCode(...data.slice(0, 3))
  if (signature !== "GIF") {
    return { isAnimated: false, format: "static" }
  }

  let frameCount = 0
  let duration = 0
  let loopCount = 0
  let hasGraphicControlExtension = false

  // Parse GIF data
  let offset = 13 // Skip header and logical screen descriptor

  while (offset < data.length) {
    const separator = data[offset]

    if (separator === 0x21) {
      // Extension
      const label = data[offset + 1]

      if (label === 0xf9) {
        // Graphic Control Extension
        hasGraphicControlExtension = true
        const delayTime = data[offset + 4] | (data[offset + 5] << 8)
        duration += delayTime * 10 // Convert to milliseconds
        offset += 8
      } else if (label === 0xff) {
        // Application Extension (for loop count)
        const blockSize = data[offset + 2]
        if (blockSize === 11) {
          const appId = String.fromCharCode(...data.slice(offset + 3, offset + 11))
          if (appId === "NETSCAPE") {
            loopCount = data[offset + 16] | (data[offset + 17] << 8)
          }
        }
        offset += 3 + blockSize
        // Skip data blocks
        while (offset < data.length && data[offset] !== 0) {
          offset += 1 + data[offset]
        }
        offset++ // Skip block terminator
      } else {
        // Other extensions
        offset += 2
        while (offset < data.length && data[offset] !== 0) {
          offset += 1 + data[offset]
        }
        offset++ // Skip block terminator
      }
    } else if (separator === 0x2c) {
      // Image descriptor
      frameCount++
      offset += 10 // Skip image descriptor

      // Skip local color table if present
      const packed = data[offset - 1]
      if (packed & 0x80) {
        const localColorTableSize = 2 << (packed & 0x07)
        offset += localColorTableSize * 3
      }

      // Skip LZW minimum code size
      offset++

      // Skip image data blocks
      while (offset < data.length && data[offset] !== 0) {
        offset += 1 + data[offset]
      }
      offset++ // Skip block terminator
    } else if (separator === 0x3b) {
      // Trailer
      break
    } else {
      offset++
    }
  }

  return {
    isAnimated: frameCount > 1,
    format: frameCount > 1 ? "gif" : "static",
    frameCount,
    duration: duration || undefined,
    loopCount: loopCount || undefined,
  }
}

/**
 * Analyze WebP for animation properties
 */
function analyzeWebP(data: Uint8Array): Partial<AnimationInfo> {
  // Check WebP signature
  const riffSignature = String.fromCharCode(...data.slice(0, 4))
  const webpSignature = String.fromCharCode(...data.slice(8, 12))

  if (riffSignature !== "RIFF" || webpSignature !== "WEBP") {
    return { isAnimated: false, format: "static" }
  }

  let frameCount = 0
  let duration = 0
  let loopCount = 0
  let hasAnimChunk = false

  // Parse WebP chunks
  let offset = 12

  while (offset < data.length - 8) {
    const chunkType = String.fromCharCode(...data.slice(offset, offset + 4))
    const chunkSize = data[offset + 4] | (data[offset + 5] << 8) | (data[offset + 6] << 16) | (data[offset + 7] << 24)

    if (chunkType === "ANIM") {
      hasAnimChunk = true
      // Background color (4 bytes) + loop count (2 bytes)
      loopCount = data[offset + 12] | (data[offset + 13] << 8)
    } else if (chunkType === "ANMF") {
      frameCount++
      // Frame duration is at offset 16-18 (3 bytes, 24-bit)
      const frameDuration = data[offset + 16] | (data[offset + 17] << 8) | (data[offset + 18] << 16)
      duration += frameDuration
    }

    offset += 8 + chunkSize
    if (chunkSize % 2 === 1) offset++ // Padding
  }

  return {
    isAnimated: hasAnimChunk && frameCount > 1,
    format: hasAnimChunk ? "webp" : "static",
    frameCount: frameCount || undefined,
    duration: duration || undefined,
    loopCount: loopCount || undefined,
  }
}

/**
 * Analyze PNG for APNG animation
 */
function analyzeAPNG(data: Uint8Array): Partial<AnimationInfo> {
  // Check PNG signature
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  for (let i = 0; i < 8; i++) {
    if (data[i] !== pngSignature[i]) {
      return { isAnimated: false, format: "static" }
    }
  }

  let frameCount = 0
  let duration = 0
  let loopCount = 0
  let hasActlChunk = false

  // Parse PNG chunks
  let offset = 8

  while (offset < data.length - 8) {
    const chunkLength = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]
    const chunkType = String.fromCharCode(...data.slice(offset + 4, offset + 8))

    if (chunkType === "acTL") {
      hasActlChunk = true
      frameCount = (data[offset + 8] << 24) | (data[offset + 9] << 16) | (data[offset + 10] << 8) | data[offset + 11]
      loopCount = (data[offset + 12] << 24) | (data[offset + 13] << 16) | (data[offset + 14] << 8) | data[offset + 15]
    } else if (chunkType === "fcTL") {
      // Frame control chunk - contains delay information
      const delayNum = (data[offset + 20] << 8) | data[offset + 21]
      const delayDen = (data[offset + 22] << 8) | data[offset + 23]
      const frameDuration = delayDen === 0 ? delayNum * 10 : (delayNum * 1000) / delayDen
      duration += frameDuration
    }

    offset += 8 + chunkLength + 4 // Length + type + data + CRC
  }

  return {
    isAnimated: hasActlChunk && frameCount > 1,
    format: hasActlChunk ? "apng" : "static",
    frameCount: frameCount || undefined,
    duration: duration || undefined,
    loopCount: loopCount || undefined,
  }
}

/**
 * Create result for GIF analysis
 */
function createGIFResult(info: Partial<AnimationInfo>): AnimationDetectionResult {
  if (!info.isAnimated) {
    return {
      isAnimated: false,
      animationInfo: {
        isAnimated: false,
        format: "static",
        canPreview: true,
        willLoseAnimation: false,
        message: "Static GIF image",
      },
      userMessage: "Static GIF will be processed normally",
      warningLevel: "info",
    }
  }

  const frameInfo = info.frameCount ? ` (${info.frameCount} frames)` : ""
  const durationInfo = info.duration ? `, ${(info.duration / 1000).toFixed(1)}s duration` : ""

  return {
    isAnimated: true,
    animationInfo: {
      ...info,
      isAnimated: true,
      format: "gif",
      canPreview: true,
      willLoseAnimation: false,
      message: `Animated GIF${frameInfo}${durationInfo}`,
      recommendation: "Animation will be preserved. GIF format is fully supported.",
    },
    userMessage: `Animated GIF detected${frameInfo}${durationInfo}. Animation will be preserved.`,
    warningLevel: "info",
  }
}

/**
 * Create result for WebP analysis
 */
function createWebPResult(info: Partial<AnimationInfo>): AnimationDetectionResult {
  if (!info.isAnimated) {
    return {
      isAnimated: false,
      animationInfo: {
        isAnimated: false,
        format: "static",
        canPreview: true,
        willLoseAnimation: false,
        message: "Static WebP image",
      },
      userMessage: "Static WebP will be processed normally",
      warningLevel: "info",
    }
  }

  const frameInfo = info.frameCount ? ` (${info.frameCount} frames)` : ""
  const durationInfo = info.duration ? `, ${(info.duration / 1000).toFixed(1)}s duration` : ""

  return {
    isAnimated: true,
    animationInfo: {
      ...info,
      isAnimated: true,
      format: "webp",
      canPreview: true,
      willLoseAnimation: false,
      message: `Animated WebP${frameInfo}${durationInfo}`,
      recommendation: "Animation will be preserved. WebP animation is fully supported.",
    },
    userMessage: `Animated WebP detected${frameInfo}${durationInfo}. Animation will be preserved.`,
    warningLevel: "info",
  }
}

/**
 * Create result for APNG analysis
 */
function createAPNGResult(info: Partial<AnimationInfo>): AnimationDetectionResult {
  if (!info.isAnimated) {
    return {
      isAnimated: false,
      animationInfo: {
        isAnimated: false,
        format: "static",
        canPreview: true,
        willLoseAnimation: false,
        message: "Static PNG image",
      },
      userMessage: "Static PNG will be processed normally",
      warningLevel: "info",
    }
  }

  const frameInfo = info.frameCount ? ` (${info.frameCount} frames)` : ""
  const durationInfo = info.duration ? `, ${(info.duration / 1000).toFixed(1)}s duration` : ""

  return {
    isAnimated: true,
    animationInfo: {
      ...info,
      isAnimated: true,
      format: "apng",
      canPreview: false,
      willLoseAnimation: true,
      message: `Animated PNG${frameInfo}${durationInfo}`,
      recommendation: "Consider converting to GIF or WebP for better browser support and smaller file size.",
    },
    userMessage: `Animated PNG detected${frameInfo}${durationInfo}. Limited browser support - animation may not display properly.`,
    warningLevel: "warning",
  }
}

/**
 * Create result for static images
 */
function createStaticResult(): AnimationDetectionResult {
  return {
    isAnimated: false,
    animationInfo: {
      isAnimated: false,
      format: "static",
      canPreview: true,
      willLoseAnimation: false,
      message: "Static image",
    },
    userMessage: "Static image will be processed normally",
    warningLevel: "info",
  }
}

/**
 * Get user-friendly animation status message
 */
export function getAnimationStatusMessage(animationInfo: AnimationInfo): {
  message: string
  icon: string
  color: string
} {
  if (!animationInfo.isAnimated) {
    return {
      message: "Static image",
      icon: "🖼️",
      color: "text-gray-600",
    }
  }

  switch (animationInfo.format) {
    case "gif":
      return {
        message: `Animated GIF ${animationInfo.frameCount ? `(${animationInfo.frameCount} frames)` : ""}`,
        icon: "🎬",
        color: "text-green-600",
      }
    case "webp":
      return {
        message: `Animated WebP ${animationInfo.frameCount ? `(${animationInfo.frameCount} frames)` : ""}`,
        icon: "🎬",
        color: "text-blue-600",
      }
    case "apng":
      return {
        message: `Animated PNG ${animationInfo.frameCount ? `(${animationInfo.frameCount} frames)` : ""}`,
        icon: "⚠️",
        color: "text-orange-600",
      }
    default:
      return {
        message: "Unknown animation format",
        icon: "❓",
        color: "text-gray-600",
      }
  }
}

/**
 * Check if animation will be preserved during compression
 */
export function willPreserveAnimation(file: File, compressionSettings: any): boolean {
  if (!["image/gif", "image/webp"].includes(file.type)) {
    return false
  }

  return compressionSettings?.preserveAnimated !== false
}
