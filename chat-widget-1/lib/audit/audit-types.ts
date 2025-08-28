export interface AuditEvent {
  id: string
  timestamp: Date
  eventType: AuditEventType
  userId?: string
  sessionId: string
  details: AuditEventDetails
  complianceFramework?: ComplianceFramework[]
  riskLevel: RiskLevel
  metadata?: Record<string, any>
}

export enum AuditEventType {
  FILE_UPLOAD = "file_upload",
  COMPLIANCE_SCAN = "compliance_scan",
  SENSITIVE_DATA_DETECTED = "sensitive_data_detected",
  CONTENT_REDACTED = "content_redacted",
  OCR_PROCESSED = "ocr_processed",
  POLICY_VIOLATION = "policy_violation",
  ACCESS_DENIED = "access_denied",
  DATA_EXPORT = "data_export",
  RETENTION_CLEANUP = "retention_cleanup",
}

export enum ComplianceFramework {
  GDPR = "gdpr",
  HIPAA = "hipaa",
  PCI_DSS = "pci_dss",
  SOC2 = "soc2",
  NIST = "nist",
  CCPA = "ccpa",
}

export enum RiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface AuditEventDetails {
  fileName?: string
  fileSize?: number
  fileType?: string
  detectedPatterns?: DetectedPattern[]
  processingMethod?: "client" | "server"
  redactionApplied?: boolean
  complianceViolations?: ComplianceViolation[]
  userAgent?: string
  ipAddress?: string
  geolocation?: string
}

export interface DetectedPattern {
  type: string
  count: number
  confidence: number
  framework: ComplianceFramework
}

export interface ComplianceViolation {
  framework: ComplianceFramework
  rule: string
  severity: RiskLevel
  description: string
  recommendation?: string
}

export interface AuditQuery {
  startDate?: Date
  endDate?: Date
  eventTypes?: AuditEventType[]
  riskLevels?: RiskLevel[]
  frameworks?: ComplianceFramework[]
  userId?: string
  sessionId?: string
  limit?: number
  offset?: number
}

export interface AuditSummary {
  totalEvents: number
  riskDistribution: Record<RiskLevel, number>
  frameworkViolations: Record<ComplianceFramework, number>
  topViolationTypes: Array<{ type: string; count: number }>
  timeRange: { start: Date; end: Date }
}

export interface RetentionPolicy {
  framework: ComplianceFramework
  retentionPeriod: number // days
  autoDelete: boolean
  archiveBeforeDelete: boolean
}
