// Compliance framework types and interfaces

export interface ComplianceResult {
  isCompliant: boolean
  violations: ComplianceViolation[]
  riskScore: number
  framework: ComplianceFramework
  processingRecommendation: ProcessingLocation
}

export interface ComplianceViolation {
  type: ViolationType
  severity: "critical" | "high" | "medium" | "low"
  description: string
  pattern: string
  location?: TextLocation
  suggestedAction: "block" | "redact" | "flag" | "log"
}

export interface TextLocation {
  start: number
  end: number
  line?: number
  column?: number
}

export type ComplianceFramework = "GDPR" | "CCPA" | "HIPAA" | "PCI_DSS" | "SOC2" | "NIST" | "ISO27001"

export type ViolationType =
  | "PII_DETECTED"
  | "FINANCIAL_DATA"
  | "MEDICAL_DATA"
  | "GOVERNMENT_ID"
  | "BIOMETRIC_DATA"
  | "LOCATION_DATA"
  | "SECURITY_CLASSIFICATION"
  | "TRADE_SECRET"
  | "LEGAL_PRIVILEGE"

export type ProcessingLocation = "client" | "server" | "blocked"

export interface ComplianceConfig {
  enabledFrameworks: ComplianceFramework[]
  riskThreshold: number
  autoRedaction: boolean
  auditLogging: boolean
  processingPreference: "privacy-first" | "performance-first" | "balanced"
}

export interface OCRResult {
  text: string
  confidence: number
  processingTime: number
  processingLocation: ProcessingLocation
  language?: string
}

export interface SensitivityClassification {
  level: "public" | "internal" | "confidential" | "restricted" | "top-secret"
  reasons: string[]
  detectedPatterns: DetectedPattern[]
}

export interface DetectedPattern {
  type: ViolationType
  pattern: string
  confidence: number
  location: TextLocation
  framework: ComplianceFramework
}
