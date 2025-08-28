/**
 * Enterprise security management and compliance features
 */

import { keyManager } from "./key-management"

export interface SecurityPolicy {
  encryptionRequired: boolean
  keyRotationInterval: number // hours
  maxKeyAge: number // hours
  auditLogging: boolean
  threatDetection: boolean
  complianceMode: "GDPR" | "HIPAA" | "SOX" | "STANDARD"
  dataRetentionDays: number
  allowPlaintextFallback: boolean
}

export interface SecurityEvent {
  id: string
  timestamp: Date
  type: "encryption" | "decryption" | "key_rotation" | "security_violation" | "compliance_check"
  severity: "low" | "medium" | "high" | "critical"
  sessionId: string
  userId?: string
  details: Record<string, any>
  metadata: {
    userAgent: string
    ipAddress?: string
    location?: string
  }
}

export interface ComplianceReport {
  generatedAt: Date
  period: { start: Date; end: Date }
  sessionId: string
  encryptionStats: {
    totalMessages: number
    encryptedMessages: number
    encryptionRate: number
    failedEncryptions: number
  }
  keyManagement: {
    keyRotations: number
    keyAge: number
    complianceStatus: "compliant" | "warning" | "violation"
  }
  securityEvents: SecurityEvent[]
  recommendations: string[]
}

class EnterpriseSecurityManager {
  private static instance: EnterpriseSecurityManager
  private securityPolicy: SecurityPolicy
  private auditLog: SecurityEvent[] = []
  private threatPatterns: Map<string, number> = new Map()
  private complianceChecks: Map<string, Date> = new Map()

  private constructor() {
    this.securityPolicy = this.getDefaultSecurityPolicy()
  }

  static getInstance(): EnterpriseSecurityManager {
    if (!EnterpriseSecurityManager.instance) {
      EnterpriseSecurityManager.instance = new EnterpriseSecurityManager()
    }
    return EnterpriseSecurityManager.instance
  }

  /**
   * Initialize enterprise security with policy
   */
  async initialize(policy: Partial<SecurityPolicy>, sessionId: string): Promise<void> {
    this.securityPolicy = { ...this.securityPolicy, ...policy }

    // Log initialization
    await this.logSecurityEvent({
      type: "compliance_check",
      severity: "low",
      sessionId,
      details: {
        action: "security_initialized",
        policy: this.securityPolicy,
      },
    })

    // Start automated compliance monitoring
    if (this.securityPolicy.auditLogging) {
      this.startComplianceMonitoring(sessionId)
    }

    // Initialize key rotation if required
    if (this.securityPolicy.encryptionRequired) {
      await this.initializeKeyRotation(sessionId)
    }
  }

  /**
   * Validate encryption compliance before message send
   */
  async validateEncryptionCompliance(sessionId: string, messageContent: string): Promise<boolean> {
    try {
      // Check if encryption is required
      if (this.securityPolicy.encryptionRequired) {
        const keyPair = keyManager.getCurrentKeyPair()
        if (!keyPair) {
          await this.logSecurityEvent({
            type: "security_violation",
            severity: "high",
            sessionId,
            details: {
              violation: "encryption_required_but_no_keys",
              messageLength: messageContent.length,
            },
          })
          return false
        }

        // Check key age
        const keyAge = Date.now() - keyPair.createdAt
        const maxAge = this.securityPolicy.maxKeyAge * 60 * 60 * 1000
        if (keyAge > maxAge) {
          await this.logSecurityEvent({
            type: "security_violation",
            severity: "medium",
            sessionId,
            details: {
              violation: "key_too_old",
              keyAge: keyAge,
              maxAge: maxAge,
            },
          })

          // Auto-rotate if possible
          if (this.securityPolicy.keyRotationInterval > 0) {
            await keyManager.rotateKeys(sessionId)
          }
        }
      }

      // Threat detection
      if (this.securityPolicy.threatDetection) {
        const threatScore = await this.analyzeThreatLevel(messageContent, sessionId)
        if (threatScore > 0.7) {
          await this.logSecurityEvent({
            type: "security_violation",
            severity: "critical",
            sessionId,
            details: {
              violation: "potential_threat_detected",
              threatScore,
              messageLength: messageContent.length,
            },
          })
          return false
        }
      }

      return true
    } catch (error) {
      await this.logSecurityEvent({
        type: "security_violation",
        severity: "high",
        sessionId,
        details: {
          violation: "compliance_check_failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      })
      return !this.securityPolicy.encryptionRequired
    }
  }

  /**
   * Log security events for audit trail
   */
  async logSecurityEvent(event: Omit<SecurityEvent, "id" | "timestamp" | "metadata">): Promise<void> {
    if (!this.securityPolicy.auditLogging) return

    const securityEvent: SecurityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      metadata: {
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
        ipAddress: "client-side", // Would be populated server-side
        location: typeof navigator !== "undefined" ? navigator.language : "Unknown",
      },
      ...event,
    }

    this.auditLog.push(securityEvent)

    // Maintain audit log size (keep last 1000 events)
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000)
    }

    // Store in localStorage for persistence (in production, send to server)
    try {
      const storedLogs = localStorage.getItem("enterprise_security_logs") || "[]"
      const logs = JSON.parse(storedLogs)
      logs.push(securityEvent)

      // Keep only recent logs based on retention policy
      const retentionMs = this.securityPolicy.dataRetentionDays * 24 * 60 * 60 * 1000
      const cutoffDate = new Date(Date.now() - retentionMs)
      const filteredLogs = logs.filter((log: SecurityEvent) => new Date(log.timestamp) > cutoffDate)

      localStorage.setItem("enterprise_security_logs", JSON.stringify(filteredLogs.slice(-1000)))
    } catch (error) {
      console.error("[v0] Failed to persist security log:", error)
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(sessionId: string, period: { start: Date; end: Date }): Promise<ComplianceReport> {
    const sessionEvents = this.auditLog.filter(
      (event) => event.sessionId === sessionId && event.timestamp >= period.start && event.timestamp <= period.end,
    )

    const encryptionEvents = sessionEvents.filter((event) => event.type === "encryption" || event.type === "decryption")
    const keyRotationEvents = sessionEvents.filter((event) => event.type === "key_rotation")
    const securityViolations = sessionEvents.filter((event) => event.type === "security_violation")

    const encryptedMessages = encryptionEvents.filter((event) => event.type === "encryption").length
    const totalMessages = encryptionEvents.length
    const encryptionRate = totalMessages > 0 ? encryptedMessages / totalMessages : 0

    const keyPair = keyManager.getCurrentKeyPair()
    const keyAge = keyPair ? Date.now() - keyPair.createdAt : 0
    const maxKeyAge = this.securityPolicy.maxKeyAge * 60 * 60 * 1000

    const complianceStatus: "compliant" | "warning" | "violation" =
      securityViolations.length > 0
        ? "violation"
        : keyAge > maxKeyAge || encryptionRate < 0.95
          ? "warning"
          : "compliant"

    const recommendations: string[] = []
    if (encryptionRate < 1.0 && this.securityPolicy.encryptionRequired) {
      recommendations.push("Increase encryption rate to 100% for full compliance")
    }
    if (keyAge > maxKeyAge) {
      recommendations.push("Rotate encryption keys to meet policy requirements")
    }
    if (securityViolations.length > 0) {
      recommendations.push("Review and address security violations")
    }

    return {
      generatedAt: new Date(),
      period,
      sessionId,
      encryptionStats: {
        totalMessages,
        encryptedMessages,
        encryptionRate,
        failedEncryptions: encryptionEvents.filter((e) => e.details.error).length,
      },
      keyManagement: {
        keyRotations: keyRotationEvents.length,
        keyAge,
        complianceStatus,
      },
      securityEvents: sessionEvents,
      recommendations,
    }
  }

  /**
   * Update security policy
   */
  updateSecurityPolicy(policy: Partial<SecurityPolicy>): void {
    this.securityPolicy = { ...this.securityPolicy, ...policy }
  }

  /**
   * Get current security policy
   */
  getSecurityPolicy(): SecurityPolicy {
    return { ...this.securityPolicy }
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    auditLogSize: number
    threatPatterns: number
    complianceChecks: number
    lastComplianceCheck: Date | null
  } {
    const lastCheck = Array.from(this.complianceChecks.values()).sort((a, b) => b.getTime() - a.getTime())[0]

    return {
      auditLogSize: this.auditLog.length,
      threatPatterns: this.threatPatterns.size,
      complianceChecks: this.complianceChecks.size,
      lastComplianceCheck: lastCheck || null,
    }
  }

  /**
   * Private: Get default security policy
   */
  private getDefaultSecurityPolicy(): SecurityPolicy {
    return {
      encryptionRequired: false,
      keyRotationInterval: 24, // 24 hours
      maxKeyAge: 168, // 7 days
      auditLogging: true,
      threatDetection: true,
      complianceMode: "STANDARD",
      dataRetentionDays: 30,
      allowPlaintextFallback: true,
    }
  }

  /**
   * Private: Initialize key rotation
   */
  private async initializeKeyRotation(sessionId: string): Promise<void> {
    const rotationInterval = this.securityPolicy.keyRotationInterval * 60 * 60 * 1000

    setInterval(async () => {
      try {
        await keyManager.rotateKeys(sessionId)
        await this.logSecurityEvent({
          type: "key_rotation",
          severity: "low",
          sessionId,
          details: {
            action: "automatic_key_rotation",
            interval: this.securityPolicy.keyRotationInterval,
          },
        })
      } catch (error) {
        await this.logSecurityEvent({
          type: "security_violation",
          severity: "high",
          sessionId,
          details: {
            violation: "key_rotation_failed",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        })
      }
    }, rotationInterval)
  }

  /**
   * Private: Start compliance monitoring
   */
  private startComplianceMonitoring(sessionId: string): void {
    // Run compliance checks every hour
    setInterval(
      async () => {
        const now = new Date()
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

        const report = await this.generateComplianceReport(sessionId, {
          start: oneHourAgo,
          end: now,
        })

        this.complianceChecks.set(sessionId, now)

        if (report.keyManagement.complianceStatus !== "compliant") {
          await this.logSecurityEvent({
            type: "compliance_check",
            severity: report.keyManagement.complianceStatus === "violation" ? "high" : "medium",
            sessionId,
            details: {
              complianceStatus: report.keyManagement.complianceStatus,
              recommendations: report.recommendations,
            },
          })
        }
      },
      60 * 60 * 1000,
    ) // 1 hour
  }

  /**
   * Private: Analyze threat level
   */
  private async analyzeThreatLevel(content: string, sessionId: string): Promise<number> {
    let threatScore = 0

    // Simple threat detection patterns
    const suspiciousPatterns = [
      /script\s*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\.cookie/i,
      /window\.location/i,
      /<iframe/i,
      /data:text\/html/i,
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        threatScore += 0.3
      }
    }

    // Check for repeated patterns (potential spam/abuse)
    const patternKey = content.substring(0, 50)
    const currentCount = this.threatPatterns.get(patternKey) || 0
    this.threatPatterns.set(patternKey, currentCount + 1)

    if (currentCount > 5) {
      threatScore += 0.4
    }

    // Length-based scoring (very long messages might be suspicious)
    if (content.length > 10000) {
      threatScore += 0.2
    }

    return Math.min(threatScore, 1.0)
  }
}

export const enterpriseSecurityManager = EnterpriseSecurityManager.getInstance()
