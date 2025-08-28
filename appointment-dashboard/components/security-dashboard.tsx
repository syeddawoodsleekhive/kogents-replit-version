"use client"

/**
 * Enterprise security dashboard component
 */

import { useState, useEffect, useCallback, memo } from "react"
import { Shield, Key, AlertTriangle, CheckCircle, Activity } from "lucide-react"
import { enterpriseSecurityManager, type SecurityPolicy, type ComplianceReport } from "@/utils/enterprise-security"
import { keyManager } from "@/utils/key-management"

interface SecurityDashboardProps {
  sessionId: string
  isVisible: boolean
  onClose: () => void
}

const SecurityDashboard = memo(function SecurityDashboard({ sessionId, isVisible, onClose }: SecurityDashboardProps) {
  const [securityPolicy, setSecurityPolicy] = useState<SecurityPolicy | null>(null)
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null)
  const [securityStats, setSecurityStats] = useState<any>(null)
  const [keyStats, setKeyStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Load security data
   */
  const loadSecurityData = useCallback(async () => {
    if (!sessionId) return

    setIsLoading(true)
    try {
      // Get current security policy
      const policy = enterpriseSecurityManager.getSecurityPolicy()
      setSecurityPolicy(policy)

      // Get security statistics
      const stats = enterpriseSecurityManager.getSecurityStats()
      setSecurityStats(stats)

      // Get key management statistics
      const keyMgmtStats = keyManager.getStats()
      setKeyStats(keyMgmtStats)

      // Generate compliance report for last 24 hours
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const report = await enterpriseSecurityManager.generateComplianceReport(sessionId, {
        start: yesterday,
        end: now,
      })
      setComplianceReport(report)
    } catch (error) {
      console.error("[v0] Failed to load security data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  /**
   * Update security policy
   */
  const updatePolicy = useCallback(
    async (updates: Partial<SecurityPolicy>) => {
      enterpriseSecurityManager.updateSecurityPolicy(updates)
      await loadSecurityData()
    },
    [loadSecurityData],
  )

  /**
   * Trigger key rotation
   */
  const rotateKeys = useCallback(async () => {
    try {
      await keyManager.rotateKeys(sessionId)
      await loadSecurityData()
    } catch (error) {
      console.error("[v0] Key rotation failed:", error)
    }
  }, [sessionId, loadSecurityData])

  // Load data when component becomes visible
  useEffect(() => {
    if (isVisible) {
      loadSecurityData()
    }
  }, [isVisible, loadSecurityData])

  // Auto-refresh every 30 seconds when visible
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(loadSecurityData, 30000)
    return () => clearInterval(interval)
  }, [isVisible, loadSecurityData])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold">Enterprise Security Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            aria-label="Close security dashboard"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading security data...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Security Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-600" size={20} />
                    <div>
                      <p className="text-sm text-green-600 font-medium">Compliance Status</p>
                      <p className="text-lg font-semibold text-green-800">
                        {complianceReport?.keyManagement.complianceStatus || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Key className="text-blue-600" size={20} />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Key Age</p>
                      <p className="text-lg font-semibold text-blue-800">
                        {keyStats ? Math.round(keyStats.currentKeyAge / (1000 * 60 * 60)) : 0}h
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <Activity className="text-purple-600" size={20} />
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Encryption Rate</p>
                      <p className="text-lg font-semibold text-purple-800">
                        {complianceReport ? Math.round(complianceReport.encryptionStats.encryptionRate * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Policy */}
              {securityPolicy && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield size={20} />
                    Security Policy
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={securityPolicy.encryptionRequired}
                          onChange={(e) => updatePolicy({ encryptionRequired: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm">Require Encryption</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={securityPolicy.auditLogging}
                          onChange={(e) => updatePolicy({ auditLogging: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm">Audit Logging</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={securityPolicy.threatDetection}
                          onChange={(e) => updatePolicy({ threatDetection: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm">Threat Detection</span>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Key Rotation (hours)</label>
                        <input
                          type="number"
                          value={securityPolicy.keyRotationInterval}
                          onChange={(e) => updatePolicy({ keyRotationInterval: Number.parseInt(e.target.value) })}
                          className="w-full px-3 py-1 border rounded text-sm"
                          min="1"
                          max="168"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Data Retention (days)</label>
                        <input
                          type="number"
                          value={securityPolicy.dataRetentionDays}
                          onChange={(e) => updatePolicy({ dataRetentionDays: Number.parseInt(e.target.value) })}
                          className="w-full px-3 py-1 border rounded text-sm"
                          min="1"
                          max="365"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Management */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Key size={20} />
                    Key Management
                  </h3>
                  <button
                    onClick={rotateKeys}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Rotate Keys Now
                  </button>
                </div>
                {keyStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Current Key Age:</p>
                      <p className="font-medium">{Math.round(keyStats.currentKeyAge / (1000 * 60 * 60))} hours</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Rotation Policy:</p>
                      <p className="font-medium">
                        Every {keyStats.rotationPolicy.rotationInterval / (1000 * 60 * 60)} hours
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Compliance Report */}
              {complianceReport && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle size={20} />
                    Compliance Report (Last 24h)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Messages:</p>
                      <p className="font-medium">{complianceReport.encryptionStats.totalMessages}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Encrypted Messages:</p>
                      <p className="font-medium">{complianceReport.encryptionStats.encryptedMessages}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Security Events:</p>
                      <p className="font-medium">{complianceReport.securityEvents.length}</p>
                    </div>
                  </div>
                  {complianceReport.recommendations.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
                        <AlertTriangle size={16} />
                        Recommendations:
                      </p>
                      <ul className="text-sm text-amber-700 space-y-1">
                        {complianceReport.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-amber-600">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default SecurityDashboard
