import {
  type AuditEvent,
  AuditEventType,
  type AuditEventDetails,
  ComplianceFramework,
  RiskLevel,
  type AuditQuery,
  type AuditSummary,
  type RetentionPolicy,
} from "./audit-types"

export class ComplianceLogger {
  private static readonly STORAGE_KEY = "compliance_audit_log"
  private static readonly MAX_EVENTS = 10000 // Maximum events to store locally
  private static readonly DEFAULT_RETENTION_DAYS = 365

  private static retentionPolicies: RetentionPolicy[] = [
    { framework: ComplianceFramework.GDPR, retentionPeriod: 1095, autoDelete: true, archiveBeforeDelete: true }, // 3 years
    { framework: ComplianceFramework.HIPAA, retentionPeriod: 2190, autoDelete: false, archiveBeforeDelete: true }, // 6 years
    { framework: ComplianceFramework.PCI_DSS, retentionPeriod: 365, autoDelete: true, archiveBeforeDelete: true }, // 1 year
    { framework: ComplianceFramework.SOC2, retentionPeriod: 1095, autoDelete: false, archiveBeforeDelete: true }, // 3 years
    { framework: ComplianceFramework.NIST, retentionPeriod: 1825, autoDelete: false, archiveBeforeDelete: true }, // 5 years
  ]

  static async logEvent(
    eventType: AuditEventType,
    details: AuditEventDetails,
    complianceFramework?: ComplianceFramework[],
    riskLevel: RiskLevel = RiskLevel.LOW,
  ): Promise<void> {
    try {
      const event: AuditEvent = {
        id: this.generateEventId(),
        timestamp: new Date(),
        eventType,
        sessionId: this.getSessionId(),
        details,
        complianceFramework,
        riskLevel,
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now(),
        },
      }

      await this.storeEvent(event)
      await this.enforceRetentionPolicies()

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.log("[v0] Compliance Event:", event)
      }
    } catch (error) {
      console.error("[v0] Failed to log compliance event:", error)
    }
  }

  static async logFileUpload(
    fileName: string,
    fileSize: number,
    fileType: string,
    detectedPatterns: Array<{ type: string; count: number; confidence: number; framework: ComplianceFramework }>,
    processingMethod: "client" | "server",
  ): Promise<void> {
    const riskLevel = this.calculateRiskLevel(detectedPatterns)
    const frameworks = [...new Set(detectedPatterns.map((p) => p.framework))]

    await this.logEvent(
      AuditEventType.FILE_UPLOAD,
      {
        fileName,
        fileSize,
        fileType,
        detectedPatterns,
        processingMethod,
      },
      frameworks,
      riskLevel,
    )
  }

  static async logComplianceScan(
    fileName: string,
    violations: Array<{ framework: ComplianceFramework; rule: string; severity: RiskLevel; description: string }>,
  ): Promise<void> {
    const frameworks = [...new Set(violations.map((v) => v.framework))]
    const maxSeverity = violations.reduce(
      (max, v) => (this.getRiskLevelValue(v.severity) > this.getRiskLevelValue(max) ? v.severity : max),
      RiskLevel.LOW,
    )

    await this.logEvent(
      AuditEventType.COMPLIANCE_SCAN,
      {
        fileName,
        complianceViolations: violations,
      },
      frameworks,
      maxSeverity,
    )
  }

  static async logSensitiveDataDetection(
    fileName: string,
    patterns: Array<{ type: string; count: number; confidence: number; framework: ComplianceFramework }>,
  ): Promise<void> {
    const frameworks = [...new Set(patterns.map((p) => p.framework))]
    const riskLevel = this.calculateRiskLevel(patterns)

    await this.logEvent(
      AuditEventType.SENSITIVE_DATA_DETECTED,
      {
        fileName,
        detectedPatterns: patterns,
      },
      frameworks,
      riskLevel,
    )
  }

  static async logContentRedaction(
    fileName: string,
    redactionApplied: boolean,
    patterns: Array<{ type: string; count: number; confidence: number; framework: ComplianceFramework }>,
  ): Promise<void> {
    const frameworks = [...new Set(patterns.map((p) => p.framework))]

    await this.logEvent(
      AuditEventType.CONTENT_REDACTED,
      {
        fileName,
        redactionApplied,
        detectedPatterns: patterns,
      },
      frameworks,
      RiskLevel.MEDIUM,
    )
  }

  private static async storeEvent(event: AuditEvent): Promise<void> {
    try {
      const existingEvents = await this.getStoredEvents()
      const updatedEvents = [event, ...existingEvents].slice(0, this.MAX_EVENTS)

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedEvents))
    } catch (error) {
      console.error("[v0] Failed to store audit event:", error)
    }
  }

  private static async getStoredEvents(): Promise<AuditEvent[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []

      const events = JSON.parse(stored)
      return events.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }))
    } catch (error) {
      console.error("[v0] Failed to retrieve stored events:", error)
      return []
    }
  }

  static async queryEvents(query: AuditQuery = {}): Promise<AuditEvent[]> {
    const events = await this.getStoredEvents()
    let filtered = events

    // Apply filters
    if (query.startDate) {
      filtered = filtered.filter((e) => e.timestamp >= query.startDate!)
    }
    if (query.endDate) {
      filtered = filtered.filter((e) => e.timestamp <= query.endDate!)
    }
    if (query.eventTypes?.length) {
      filtered = filtered.filter((e) => query.eventTypes!.includes(e.eventType))
    }
    if (query.riskLevels?.length) {
      filtered = filtered.filter((e) => query.riskLevels!.includes(e.riskLevel))
    }
    if (query.frameworks?.length) {
      filtered = filtered.filter((e) => e.complianceFramework?.some((f) => query.frameworks!.includes(f)))
    }
    if (query.sessionId) {
      filtered = filtered.filter((e) => e.sessionId === query.sessionId)
    }

    // Apply pagination
    const offset = query.offset || 0
    const limit = query.limit || filtered.length

    return filtered.slice(offset, offset + limit)
  }

  static async generateSummary(query: AuditQuery = {}): Promise<AuditSummary> {
    const events = await this.queryEvents(query)

    const riskDistribution = events.reduce(
      (acc, event) => {
        acc[event.riskLevel] = (acc[event.riskLevel] || 0) + 1
        return acc
      },
      {} as Record<RiskLevel, number>,
    )

    const frameworkViolations = events.reduce(
      (acc, event) => {
        event.complianceFramework?.forEach((framework) => {
          acc[framework] = (acc[framework] || 0) + 1
        })
        return acc
      },
      {} as Record<ComplianceFramework, number>,
    )

    const violationTypes = events.reduce(
      (acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const topViolationTypes = Object.entries(violationTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }))

    const timestamps = events.map((e) => e.timestamp)
    const timeRange = {
      start: timestamps.length > 0 ? new Date(Math.min(...timestamps.map((t) => t.getTime()))) : new Date(),
      end: timestamps.length > 0 ? new Date(Math.max(...timestamps.map((t) => t.getTime()))) : new Date(),
    }

    return {
      totalEvents: events.length,
      riskDistribution,
      frameworkViolations,
      topViolationTypes,
      timeRange,
    }
  }

  private static async enforceRetentionPolicies(): Promise<void> {
    try {
      const events = await this.getStoredEvents()
      const now = new Date()

      const retainedEvents = events.filter((event) => {
        if (!event.complianceFramework?.length) {
          // Default retention for events without specific framework
          const daysSinceEvent = (now.getTime() - event.timestamp.getTime()) / (1000 * 60 * 60 * 24)
          return daysSinceEvent <= this.DEFAULT_RETENTION_DAYS
        }

        // Check against framework-specific retention policies
        return event.complianceFramework.some((framework) => {
          const policy = this.retentionPolicies.find((p) => p.framework === framework)
          if (!policy) return true // Keep if no policy defined

          const daysSinceEvent = (now.getTime() - event.timestamp.getTime()) / (1000 * 60 * 60 * 24)
          return daysSinceEvent <= policy.retentionPeriod
        })
      })

      if (retainedEvents.length !== events.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(retainedEvents))
      }
    } catch (error) {
      console.error("[v0] Failed to enforce retention policies:", error)
    }
  }

  private static calculateRiskLevel(patterns: Array<{ confidence: number }>): RiskLevel {
    if (patterns.length === 0) return RiskLevel.LOW

    const maxConfidence = Math.max(...patterns.map((p) => p.confidence))
    const patternCount = patterns.length

    if (maxConfidence >= 0.9 && patternCount >= 3) return RiskLevel.CRITICAL
    if (maxConfidence >= 0.8 && patternCount >= 2) return RiskLevel.HIGH
    if (maxConfidence >= 0.7 || patternCount >= 1) return RiskLevel.MEDIUM

    return RiskLevel.LOW
  }

  private static getRiskLevelValue(level: RiskLevel): number {
    const values = { [RiskLevel.LOW]: 1, [RiskLevel.MEDIUM]: 2, [RiskLevel.HIGH]: 3, [RiskLevel.CRITICAL]: 4 }
    return values[level] || 1
  }

  private static generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem("compliance_session_id")
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem("compliance_session_id", sessionId)
    }
    return sessionId
  }

  static async exportAuditLog(query: AuditQuery = {}): Promise<string> {
    const events = await this.queryEvents(query)
    return JSON.stringify(events, null, 2)
  }

  static async clearAuditLog(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY)
  }
}
