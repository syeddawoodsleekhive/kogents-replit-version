/**
 * EXIF Orientation Utilities
 * Handles EXIF data extraction and orientation correction for mobile photos
 */

export interface EXIFData {
  orientation?: number
  make?: string
  model?: string
  dateTime?: string
  gpsLatitude?: number
  gpsLongitude?: number
}

export interface OrientationInfo {
  orientation: number
  rotation: number
  scaleX: number
  scaleY: number
  cssTransform: string
}

/**
 * EXIF orientation values and their corresponding transformations
 */
const ORIENTATION_TRANSFORMS: Record<number, Omit<OrientationInfo, "orientation">> = {
  1: { rotation: 0, scaleX: 1, scaleY: 1, cssTransform: "none" },
  2: { rotation: 0, scaleX: -1, scaleY: 1, cssTransform: "scaleX(-1)" },
  3: { rotation: 180, scaleX: 1, scaleY: 1, cssTransform: "rotate(180deg)" },
  4: { rotation: 180, scaleX: -1, scaleY: 1, cssTransform: "rotate(180deg) scaleX(-1)" },
  5: { rotation: 90, scaleX: -1, scaleY: 1, cssTransform: "rotate(90deg) scaleX(-1)" },
  6: { rotation: 90, scaleX: 1, scaleY: 1, cssTransform: "rotate(90deg)" },
  7: { rotation: 270, scaleX: -1, scaleY: 1, cssTransform: "rotate(270deg) scaleX(-1)" },
  8: { rotation: 270, scaleX: 1, scaleY: 1, cssTransform: "rotate(270deg)" },
}

/**
 * Extract EXIF data from image file
 */
export async function extractEXIFData(file: File): Promise<EXIFData> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      if (!arrayBuffer) {
        resolve({})
        return
      }

      try {
        const exifData = parseEXIFFromArrayBuffer(arrayBuffer)
        resolve(exifData)
      } catch (error) {
        console.warn("Failed to parse EXIF data:", error)
        resolve({})
      }
    }

    reader.onerror = () => resolve({})
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Parse EXIF data from ArrayBuffer
 */
function parseEXIFFromArrayBuffer(buffer: ArrayBuffer): EXIFData {
  const view = new DataView(buffer)
  const exifData: EXIFData = {}

  // Check for JPEG SOI marker
  if (view.getUint16(0) !== 0xffd8) {
    return exifData
  }

  let offset = 2
  let marker: number

  // Find APP1 marker (EXIF)
  while (offset < view.byteLength) {
    marker = view.getUint16(offset)

    if (marker === 0xffe1) {
      // APP1 marker
      const exifLength = view.getUint16(offset + 2)
      const exifStart = offset + 4

      // Check for EXIF identifier
      if (view.getUint32(exifStart) === 0x45786966 && view.getUint16(exifStart + 4) === 0x0000) {
        const tiffStart = exifStart + 6
        parseEXIFTags(view, tiffStart, exifData)
      }
      break
    } else if ((marker & 0xff00) !== 0xff00) {
      break
    } else {
      offset += 2 + view.getUint16(offset + 2)
    }
  }

  return exifData
}

/**
 * Parse EXIF tags from TIFF data
 */
function parseEXIFTags(view: DataView, tiffStart: number, exifData: EXIFData): void {
  // Check TIFF header
  const byteOrder = view.getUint16(tiffStart)
  const isLittleEndian = byteOrder === 0x4949

  const getUint16 = (offset: number) => view.getUint16(offset, isLittleEndian)
  const getUint32 = (offset: number) => view.getUint32(offset, isLittleEndian)

  // Get IFD0 offset
  const ifd0Offset = getUint32(tiffStart + 4)
  const ifd0Start = tiffStart + ifd0Offset

  // Read IFD0 entries
  const entryCount = getUint16(ifd0Start)

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = ifd0Start + 2 + i * 12
    const tag = getUint16(entryOffset)
    const type = getUint16(entryOffset + 2)
    const count = getUint32(entryOffset + 4)
    const valueOffset = entryOffset + 8

    switch (tag) {
      case 0x0112: // Orientation
        exifData.orientation = getUint16(valueOffset)
        break
      case 0x010f: // Make
        if (type === 2 && count > 0) {
          // ASCII string
          exifData.make = readString(view, tiffStart + getUint32(valueOffset), count - 1)
        }
        break
      case 0x0110: // Model
        if (type === 2 && count > 0) {
          // ASCII string
          exifData.model = readString(view, tiffStart + getUint32(valueOffset), count - 1)
        }
        break
    }
  }
}

/**
 * Read ASCII string from DataView
 */
function readString(view: DataView, offset: number, length: number): string {
  let result = ""
  for (let i = 0; i < length; i++) {
    const char = view.getUint8(offset + i)
    if (char === 0) break
    result += String.fromCharCode(char)
  }
  return result
}

/**
 * Get orientation information from EXIF orientation value
 */
export function getOrientationInfo(orientation = 1): OrientationInfo {
  const transform = ORIENTATION_TRANSFORMS[orientation] || ORIENTATION_TRANSFORMS[1]
  return {
    orientation,
    ...transform,
  }
}

/**
 * Apply orientation correction to canvas
 */
export function applyOrientationToCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  orientation: number,
  width: number,
  height: number,
): void {
  const info = getOrientationInfo(orientation)

  // Reset canvas size based on orientation
  if (orientation >= 5 && orientation <= 8) {
    // Rotated 90 or 270 degrees - swap dimensions
    canvas.width = height
    canvas.height = width
  } else {
    canvas.width = width
    canvas.height = height
  }

  // Apply transformations
  ctx.save()

  switch (orientation) {
    case 2:
      ctx.translate(width, 0)
      ctx.scale(-1, 1)
      break
    case 3:
      ctx.translate(width, height)
      ctx.rotate(Math.PI)
      break
    case 4:
      ctx.translate(0, height)
      ctx.scale(1, -1)
      break
    case 5:
      ctx.rotate(0.5 * Math.PI)
      ctx.scale(1, -1)
      break
    case 6:
      ctx.rotate(0.5 * Math.PI)
      ctx.translate(0, -height)
      break
    case 7:
      ctx.rotate(0.5 * Math.PI)
      ctx.translate(width, -height)
      ctx.scale(-1, 1)
      break
    case 8:
      ctx.rotate(-0.5 * Math.PI)
      ctx.translate(-width, 0)
      break
  }
}

/**
 * Create CSS transform for image orientation
 */
export function createOrientationCSS(orientation: number): string {
  const info = getOrientationInfo(orientation)
  return info.cssTransform
}

/**
 * Check if orientation requires dimension swap
 */
export function requiresDimensionSwap(orientation: number): boolean {
  return orientation >= 5 && orientation <= 8
}

/**
 * Strip EXIF data from image (for privacy)
 */
export async function stripEXIFData(file: File): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) {
          const strippedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: file.lastModified,
          })
          resolve(strippedFile)
        } else {
          resolve(file)
        }
      }, file.type)
    }

    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}
