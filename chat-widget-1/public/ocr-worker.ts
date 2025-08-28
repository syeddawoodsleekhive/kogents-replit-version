// Web worker for client-side OCR processing

import { ClientOCR } from "../lib/ocr/client-ocr"
import type { OCRConfig } from "../lib/ocr/types"

// Worker message types
interface OCRWorkerMessage {
  type: "PROCESS_FILE"
  file: File
  config: OCRConfig
  id: string
}

interface OCRWorkerResponse {
  type: "PROCESS_COMPLETE" | "PROCESS_ERROR" | "PROGRESS"
  id: string
  result?: any
  error?: string
  progress?: number
}

let clientOCR: ClientOCR | null = null

self.onmessage = async (event: MessageEvent<OCRWorkerMessage>) => {
  const { type, file, config, id } = event.data

  if (type === "PROCESS_FILE") {
    try {
      // Initialize OCR engine if needed
      if (!clientOCR) {
        clientOCR = new ClientOCR(config)
      }

      // Send progress updates
      const progressInterval = setInterval(() => {
        self.postMessage({
          type: "PROGRESS",
          id,
          progress: Math.random() * 100, // Placeholder progress
        } as OCRWorkerResponse)
      }, 1000)

      // Process the file
      const result = await clientOCR.extractText(file)

      clearInterval(progressInterval)

      // Send completion
      self.postMessage({
        type: "PROCESS_COMPLETE",
        id,
        result,
      } as OCRWorkerResponse)
    } catch (error) {
      self.postMessage({
        type: "PROCESS_ERROR",
        id,
        error: error instanceof Error ? error.message : "Unknown error",
      } as OCRWorkerResponse)
    }
  }
}
