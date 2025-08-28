import type { ComplianceFramework, RiskLevel } from "./types"

export interface ComplianceConfiguration {
  framework: ComplianceFramework
  enabled: boolean
  strictMode: boolean
  riskThreshold: RiskLevel
  autoRedaction: boolean
  auditLogging: boolean
  retentionDays: number
  customRules?: ComplianceRule[]
}

export interface ComplianceRule {
  id: string
  name: string
  description: string
  pattern: string
  type: string
  severity: RiskLevel
  enabled: boolean
  framework: ComplianceFramework
  action: "block" | "redact" | "flag" | "log"
}

export interface OrganizationProfile {
  industry: "healthcare" | "finance" | "legal" | "government" | "education" | "general"
  region: "us" | "eu" | "apac" | "global"
  size: "small" | "medium" | "large" | "enterprise"
  complianceLevel: "basic" | "standard" | "strict" | "custom"
}

export class ComplianceConfig {
  private static readonly DEFAULT_CONFIGURATIONS: Record<ComplianceFramework, ComplianceConfiguration> = {
    gdpr: {
      framework: "gdpr",
      enabled: true,
      strictMode: false,
      riskThreshold: "medium",
      autoRedaction: true,
      auditLogging: true,
      retentionDays: 1095, // 3 years
    },
    hipaa: {
      framework: "hipaa",
      enabled: false,
      strictMode: true,
      riskThreshold: "low",
      autoRedaction: true,
      auditLogging: true,
      retentionDays: 2190, // 6 years
    },
    pci_dss: {
      framework: "pci_dss",
      enabled: true,
      strictMode: true,
      riskThreshold: "low",
      autoRedaction: true,
      auditLogging: true,
      retentionDays: 365, // 1 year
    },
    soc2: {
      framework: "soc2",
      enabled: false,
      strictMode: false,
      riskThreshold: "medium",
      autoRedaction: false,
      auditLogging: true,
      retentionDays: 1095, // 3 years
    },
    nist: {
      framework: "nist",
      enabled: false,
      strictMode: false,
      riskThreshold: "medium",
      autoRedaction: false,
      auditLogging: true,
      retentionDays: 1825, // 5 years
    },
    ccpa: {
      framework: "ccpa",
      enabled: true,
      strictMode: false,
      riskThreshold: "medium",
      autoRedaction: true,
      auditLogging: true,
      retentionDays: 1095, // 3 years
    },
  }

  private static readonly INDUSTRY_PROFILES: Record<string, ComplianceFramework[]> = {
    healthcare: ["hipaa", "gdpr", "nist"],
    finance: ["pci_dss", "soc2", "gdpr", "nist"],
    legal: ["gdpr", "ccpa", "soc2"],
    government: ["nist", "soc2", "gdpr"],
    education: ["gdpr", "ccpa", "nist"],
    general: ["gdpr", "ccpa", "pci_dss"],
  }

  private static configurations: Map<ComplianceFramework, ComplianceConfiguration> = new Map()
  private static organizationProfile: OrganizationProfile | null = null

  static initialize(profile?: OrganizationProfile): void {
    // Set organization profile
    if (profile) {
      this.organizationProfile = profile
    }

    // Load configurations from storage or use defaults
    this.loadConfigurations()

    // Apply industry-specific defaults if profile provided
    if (profile) {
      this.applyIndustryDefaults(profile)
    }
  }

  static getConfiguration(framework: ComplianceFramework): ComplianceConfiguration {
    return this.configurations.get(framework) || this.DEFAULT_CONFIGURATIONS[framework]
  }

  static updateConfiguration(framework: ComplianceFramework, updates: Partial<ComplianceConfiguration>): void {
    const current = this.getConfiguration(framework)
    const updated = { ...current, ...updates }

    this.configurations.set(framework, updated)
    this.saveConfigurations()
  }

  static getEnabledFrameworks(): ComplianceFramework[] {
    const enabled: ComplianceFramework[] = []

    for (const framework of Object.keys(this.DEFAULT_CONFIGURATIONS) as ComplianceFramework[]) {
      const config = this.getConfiguration(framework)
      if (config.enabled) {
        enabled.push(framework)
      }
    }

    return enabled
  }

  static getFrameworksByRiskThreshold(threshold: RiskLevel): ComplianceFramework[] {
    const frameworks: ComplianceFramework[] = []
    const thresholdValue = this.getRiskLevelValue(threshold)

    for (const framework of this.getEnabledFrameworks()) {
      const config = this.getConfiguration(framework)
      const configThresholdValue = this.getRiskLevelValue(config.riskThreshold)

      if (configThresholdValue <= thresholdValue) {
        frameworks.push(framework)
      }
    }

    return frameworks
  }

  static shouldAutoRedact(framework: ComplianceFramework): boolean {
    const config = this.getConfiguration(framework)
    return config.autoRedaction
  }

  static shouldAuditLog(framework: ComplianceFramework): boolean {
    const config = this.getConfiguration(framework)
    return config.auditLogging
  }

  static isStrictMode(framework: ComplianceFramework): boolean {
    const config = this.getConfiguration(framework)
    return config.strictMode
  }

  static getRetentionPeriod(framework: ComplianceFramework): number {
    const config = this.getConfiguration(framework)
    return config.retentionDays
  }

  static createCustomRule(rule: Omit<ComplianceRule, "id">): ComplianceRule {
    const customRule: ComplianceRule = {
      ...rule,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    // Add to framework configuration
    const config = this.getConfiguration(rule.framework)
    const customRules = config.customRules || []
    customRules.push(customRule)

    this.updateConfiguration(rule.framework, { customRules })

    return customRule
  }

  static getCustomRules(framework: ComplianceFramework): ComplianceRule[] {
    const config = this.getConfiguration(framework)
    return config.customRules || []
  }

  static updateCustomRule(ruleId: string, updates: Partial<ComplianceRule>): boolean {
    for (const framework of Object.keys(this.DEFAULT_CONFIGURATIONS) as ComplianceFramework[]) {
      const config = this.getConfiguration(framework)
      const customRules = config.customRules || []

      const ruleIndex = customRules.findIndex((rule) => rule.id === ruleId)
      if (ruleIndex !== -1) {
        customRules[ruleIndex] = { ...customRules[ruleIndex], ...updates }
        this.updateConfiguration(framework, { customRules })
        return true
      }
    }

    return false
  }

  static deleteCustomRule(ruleId: string): boolean {
    for (const framework of Object.keys(this.DEFAULT_CONFIGURATIONS) as ComplianceFramework[]) {
      const config = this.getConfiguration(framework)
      const customRules = config.customRules || []

      const filteredRules = customRules.filter((rule) => rule.id !== ruleId)
      if (filteredRules.length !== customRules.length) {
        this.updateConfiguration(framework, { customRules: filteredRules })
        return true
      }
    }

    return false
  }

  static exportConfiguration(): string {
    const exportData = {
      organizationProfile: this.organizationProfile,
      configurations: Object.fromEntries(this.configurations),
      exportDate: new Date().toISOString(),
      version: "1.0",
    }

    return JSON.stringify(exportData, null, 2)
  }

  static importConfiguration(configJson: string): boolean {
    try {
      const importData = JSON.parse(configJson)

      if (importData.organizationProfile) {
        this.organizationProfile = importData.organizationProfile
      }

      if (importData.configurations) {
        for (const [framework, config] of Object.entries(importData.configurations)) {
          this.configurations.set(framework as ComplianceFramework, config as ComplianceConfiguration)
        }
      }

      this.saveConfigurations()
      return true
    } catch (error) {
      console.error("[v0] Failed to import configuration:", error)
      return false
    }
  }

  private static loadConfigurations(): void {
    try {
      const stored = localStorage.getItem("compliance_configurations")
      if (stored) {
        const configs = JSON.parse(stored)
        for (const [framework, config] of Object.entries(configs)) {
          this.configurations.set(framework as ComplianceFramework, config as ComplianceConfiguration)
        }
      }

      const storedProfile = localStorage.getItem("organization_profile")
      if (storedProfile) {
        this.organizationProfile = JSON.parse(storedProfile)
      }
    } catch (error) {
      console.error("[v0] Failed to load configurations:", error)
    }
  }

  private static saveConfigurations(): void {
    try {
      const configs = Object.fromEntries(this.configurations)
      localStorage.setItem("compliance_configurations", JSON.stringify(configs))

      if (this.organizationProfile) {
        localStorage.setItem("organization_profile", JSON.stringify(this.organizationProfile))
      }
    } catch (error) {
      console.error("[v0] Failed to save configurations:", error)
    }
  }

  private static applyIndustryDefaults(profile: OrganizationProfile): void {
    const recommendedFrameworks = this.INDUSTRY_PROFILES[profile.industry] || this.INDUSTRY_PROFILES.general

    // Enable recommended frameworks
    for (const framework of recommendedFrameworks) {
      const config = this.getConfiguration(framework)
      this.updateConfiguration(framework, { enabled: true })
    }

    // Apply compliance level adjustments
    this.applyComplianceLevelDefaults(profile.complianceLevel)
  }

  private static applyComplianceLevelDefaults(level: string): void {
    const frameworks = this.getEnabledFrameworks()

    switch (level) {
      case "strict":
        frameworks.forEach((framework) => {
          this.updateConfiguration(framework, {
            strictMode: true,
            riskThreshold: "low",
            autoRedaction: true,
            auditLogging: true,
          })
        })
        break
      case "basic":
        frameworks.forEach((framework) => {
          this.updateConfiguration(framework, {
            strictMode: false,
            riskThreshold: "high",
            autoRedaction: false,
            auditLogging: false,
          })
        })
        break
      case "standard":
      default:
        // Use default configurations
        break
    }
  }

  private static getRiskLevelValue(level: RiskLevel): number {
    const values: Record<RiskLevel, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    }
    return values[level] || 2
  }
}
