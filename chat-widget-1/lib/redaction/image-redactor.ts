export interface ImageRedactionOptions {
  blurRadius?: number
  overlayColor?: string
  overlayOpacity?: number
  preserveAspectRatio?: boolean
}

export interface ImageRedactionResult {
  redactedImageUrl: string
  redactionAreas: RedactionArea[]
  processingTime: number
  success: boolean
  error?: string
}

export interface RedactionArea {
  x: number
  y: number
  width: number
  height: number
  type: string
  confidence: number
}

export class ImageRedactor {
  private static readonly DEFAULT_BLUR_RADIUS = 20
  private static readonly DEFAULT_OVERLAY_COLOR = "#000000"
  private static readonly DEFAULT_OVERLAY_OPACITY = 0.8

  static async redactSensitiveAreas(
    imageFile: File,
    detectedAreas: RedactionArea[],
    options: ImageRedactionOptions = {},
  ): Promise<ImageRedactionResult> {
    const startTime = performance.now()

    try {
      const {
        blurRadius = this.DEFAULT_BLUR_RADIUS,
        overlayColor = this.DEFAULT_OVERLAY_COLOR,
        overlayOpacity = this.DEFAULT_OVERLAY_OPACITY,
        preserveAspectRatio = true,
      } = options

      // Create canvas for image processing
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Canvas context not available")
      }

      // Load image
      const img = await this.loadImage(imageFile)

      // Set canvas dimensions
      canvas.width = img.width
      canvas.height = img.height

      // Draw original image
      ctx.drawImage(img, 0, 0)

      // Apply redactions
      for (const area of detectedAreas) {
        if (area.confidence < 0.7) continue // Skip low confidence areas

        await this.applyRedactionToArea(ctx, area, {
          blurRadius,
          overlayColor,
          overlayOpacity,
        })
      }

      // Convert to blob and create URL
      const redactedBlob = await this.canvasToBlob(canvas)
      const redactedImageUrl = URL.createObjectURL(redactedBlob)

      const processingTime = performance.now() - startTime

      return {
        redactedImageUrl,
        redactionAreas: detectedAreas,
        processingTime,
        success: true,
      }
    } catch (error) {
      return {
        redactedImageUrl: "",
        redactionAreas: [],
        processingTime: performance.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error("Failed to load image"))

      const url = URL.createObjectURL(file)
      img.src = url

      // Cleanup URL after loading
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
    })
  }

  private static async applyRedactionToArea(
    ctx: CanvasRenderingContext2D,
    area: RedactionArea,
    options: { blurRadius: number; overlayColor: string; overlayOpacity: number },
  ): Promise<void> {
    const { x, y, width, height } = area
    const { blurRadius, overlayColor, overlayOpacity } = options

    // Save current context state
    ctx.save()

    // Create clipping path for the area
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.clip()

    // Apply blur effect (simplified - in production, use proper blur filter)
    ctx.filter = `blur(${blurRadius}px)`

    // Get image data for the area
    const imageData = ctx.getImageData(x, y, width, height)

    // Apply blur by drawing the area multiple times with slight offsets
    for (let i = 0; i < 5; i++) {
      ctx.putImageData(imageData, x + (i - 2), y + (i - 2))
    }

    // Reset filter
    ctx.filter = "none"

    // Add overlay
    ctx.globalAlpha = overlayOpacity
    ctx.fillStyle = overlayColor
    ctx.fillRect(x, y, width, height)

    // Restore context state
    ctx.restore()
  }

  private static canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("Failed to convert canvas to blob"))
          }
        },
        "image/png",
        0.9,
      )
    })
  }

  static async detectSensitiveAreas(imageFile: File): Promise<RedactionArea[]> {
    // This would integrate with OCR results to identify areas containing sensitive text
    // For now, return empty array - would be populated by OCR text detection
    return []
  }

  static cleanup(imageUrl: string): void {
    if (imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl)
    }
  }
}
