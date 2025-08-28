// Client-side OCR using Tesseract.js

import type { OCRResult, OCRConfig } from "./types"

export class ClientOCR {
  private config: OCRConfig
  private tesseractWorker: any = null
  private isInitialized = false

  constructor(config: OCRConfig) {
    this.config = config
  }

  async extractText(file: File): Promise<OCRResult> {
    if (this.config.clientSideEngine === "disabled") {
      throw new Error("Client-side OCR is disabled")
    }

    const startTime = Date.now()

    try {
      await this.initializeTesseract()

      console.log("[v0] Starting client-side OCR processing")

      // Convert file to image data
      const imageData = await this.fileToImageData(file)

      // Process with Tesseract
      const result = await this.tesseractWorker.recognize(imageData, {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            console.log(`[v0] OCR progress: ${Math.round(m.progress * 100)}%`)
          }
        },
      })

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        processingTime: Date.now() - startTime,
        processingLocation: "client",
        language: this.detectLanguage(result.data.text),
      }
    } catch (error) {
      console.error("[v0] Client OCR failed:", error)
      throw new Error(`Client-side OCR failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private async initializeTesseract(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Dynamic import to avoid bundling Tesseract unless needed
      const { createWorker } = await import("tesseract.js")

      console.log("[v0] Initializing Tesseract worker")
      this.tesseractWorker = await createWorker(this.config.languages)
      this.isInitialized = true
    } catch (error) {
      throw new Error("Failed to initialize Tesseract: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  private async fileToImageData(file: File): Promise<HTMLCanvasElement | File> {
    // For images, we can pass the file directly to Tesseract
    if (file.type.startsWith("image/")) {
      return file
    }

    // For PDFs, we'd need to convert to image first
    if (file.type === "application/pdf") {
      return await this.convertPdfToImage(file)
    }

    throw new Error(`Unsupported file type for client-side OCR: ${file.type}`)
  }

  private async convertPdfToImage(file: File): Promise<HTMLCanvasElement> {
    try {
      // Dynamic import PDF.js
      const pdfjsLib = await import("pdfjs-dist")

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const page = await pdf.getPage(1) // Process first page only for now

      const viewport = page.getViewport({ scale: 2.0 })
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")!

      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise

      return canvas
    } catch (error) {
      throw new Error(`PDF conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on character patterns
    const hasArabic = /[\u0600-\u06FF]/.test(text)
    const hasChinese = /[\u4e00-\u9fff]/.test(text)
    const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(text)
    const hasKorean = /[\uac00-\ud7af]/.test(text)
    const hasHebrew = /[\u0590-\u05FF]/.test(text)

    if (hasArabic) return "ar"
    if (hasChinese) return "zh"
    if (hasJapanese) return "ja"
    if (hasKorean) return "ko"
    if (hasHebrew) return "he"

    return "en" // Default to English
  }

  async cleanup(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate()
      this.tesseractWorker = null
      this.isInitialized = false
    }
  }
}
