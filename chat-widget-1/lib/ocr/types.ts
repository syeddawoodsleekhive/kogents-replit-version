// OCR processing types and interfaces

export interface OCRConfig {
  clientSideEngine: "tesseract" | "disabled"
  serverSideProviders: ("google" | "aws" | "azure")[]
  fallbackToServer: boolean
  maxFileSize: number
  supportedFormats: string[]
  languages: string[]
}

export interface OCRResult {
  text: string
  confidence: number
  processingTime: number
  processingLocation: "client" | "server"
  language?: string
  error?: string
}

export interface ProcessingDecision {
  location: "client" | "server" | "blocked"
  reason: string
  sensitivityLevel: number
  estimatedProcessingTime: number
}
