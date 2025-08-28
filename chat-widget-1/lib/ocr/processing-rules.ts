import type { ProcessingMethod, OCRProvider } from "./types"
import type { ComplianceFramework } from "../compliance/types"

export interface ProcessingRule {
  id: string
  name: string
  description: string
  conditions: ProcessingCondition[]
  action: ProcessingAction
  priority: number
  enabled: boolean
}

export interface ProcessingCondition {
  type: "fileSize" | "fileType" | "sensitivity" | "framework" | "userRole" | "custom"
  operator: "equals" | "contains" | "greaterThan" | "lessThan" | "in" | "matches"
  value: any
  weight: number
}

export interface ProcessingAction {
  method: ProcessingMethod
  provider?: OCRProvider
  options?: {
    quality?: "fast" | "balanced" | "accurate"
    language?: string
    enableCompliance?: boolean
    maxRetries?: number
  }
}

export interface ProcessingDecision {
  method: ProcessingMethod
  provider?: OCRProvider
  reasoning: string[]
  confidence: number
  appliedRules: string[]
}

export class ProcessingRules {
  private static readonly BUILT_IN_RULES: ProcessingRule[] = [
    // High sensitivity documents - always client-side
    {
      id: "high_sensitivity_client",
      name: "High Sensitivity Client Processing",
      description: "Process highly sensitive documents on client-side only",
      conditions: [
        { type: "sensitivity", operator: "in", value: ["restricted", "confidential"], weight: 1.0 },
        { type: "framework", operator: "in", value: ["hipaa", "pci_dss"], weight: 0.9 },
      ],
      action: {
        method: "client",
        options: {
          quality: "accurate",
          enableCompliance: true,
          maxRetries: 2,
        },
      },
      priority: 100,
      enabled: true,
    },

    // Large files - server-side for performance
    {
      id: "large_files_server",
      name: "Large Files Server Processing",
      description: "Process large files on server for better performance",
      conditions: [
        { type: "fileSize", operator: "greaterThan", value: 10 * 1024 * 1024, weight: 0.8 }, // 10MB
        { type: "sensitivity", operator: "in", value: ["public", "internal"], weight: 0.6 },
      ],
      action: {
        method: "server",
        provider: "google_vision",
        options: {
          quality: "balanced",
          enableCompliance: true,
          maxRetries: 3,
        },
      },
      priority: 80,
      enabled: true,
    },

    // Image files - prefer server for accuracy
    {
      id: "images_server_accurate",
      name: "Images Server Accurate Processing",
      description: "Process image files on server for higher accuracy",
      conditions: [
        { type: "fileType", operator: "in", value: ["image/jpeg", "image/png", "image/tiff"], weight: 0.7 },
        { type: "sensitivity", operator: "equals", value: "public", weight: 0.5 },
      ],
      action: {
        method: "server",
        provider: "aws_textract",
        options: {
          quality: "accurate",
          enableCompliance: false,
          maxRetries: 2,
        },
      },
      priority: 60,
      enabled: true,
    },

    // PDF documents - hybrid approach
    {
      id: "pdf_hybrid",
      name: "PDF Hybrid Processing",
      description: "Use hybrid approach for PDF documents based on content",
      conditions: [{ type: "fileType", operator: "equals", value: "application/pdf", weight: 0.8 }],
      action: {
        method: "auto",
        options: {
          quality: "balanced",
          enableCompliance: true,
          maxRetries: 2,
        },
      },
      priority: 40,
      enabled: true,
    },

    // Small files - client-side for speed
    {
      id: "small_files_client",
      name: "Small Files Client Processing",
      description: "Process small files on client for faster response",
      conditions: [
        { type: "fileSize", operator: "lessThan", value: 1024 * 1024, weight: 0.6 }, // 1MB
        { type: "sensitivity", operator: "in", value: ["public", "internal"], weight: 0.4 },
      ],
      action: {
        method: "client",
        options: {
          quality: "fast",
          enableCompliance: true,
          maxRetries: 1,
        },
      },
      priority: 20,
      enabled: true,
    },
  ]

  private static customRules: ProcessingRule[] = []

  static determineProcessingMethod(
    fileSize: number,
    fileType: string,
    sensitivity: string,
    frameworks: ComplianceFramework[] = [],
    userRole?: string,
  ): ProcessingDecision {
    const context = {
      fileSize,
      fileType,
      sensitivity,
      frameworks,
      userRole,
    }

    // Get all applicable rules
    const applicableRules = this.getApplicableRules(context)

    if (applicableRules.length === 0) {
      return {
        method: "auto",
        reasoning: ["No specific rules matched, using automatic detection"],
        confidence: 0.5,
        appliedRules: [],
      }
    }

    // Sort by priority (highest first)
    applicableRules.sort((a, b) => b.priority - a.priority)

    // Use the highest priority rule
    const selectedRule = applicableRules[0]
    const reasoning = [
      `Applied rule: ${selectedRule.name}`,
      `Priority: ${selectedRule.priority}`,
      `Method: ${selectedRule.action.method}`,
    ]

    // Calculate confidence based on rule conditions
    const confidence = this.calculateRuleConfidence(selectedRule, context)

    return {
      method: selectedRule.action.method,
      provider: selectedRule.action.provider,
      reasoning,
      confidence,
      appliedRules: [selectedRule.id],
    }
  }

  static addCustomRule(rule: Omit<ProcessingRule, "id">): ProcessingRule {
    const customRule: ProcessingRule = {
      ...rule,
      id: `custom_processing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    this.customRules.push(customRule)
    this.saveCustomRules()

    return customRule
  }

  static updateCustomRule(ruleId: string, updates: Partial<ProcessingRule>): boolean {
    const ruleIndex = this.customRules.findIndex((rule) => rule.id === ruleId)
    if (ruleIndex !== -1) {
      this.customRules[ruleIndex] = { ...this.customRules[ruleIndex], ...updates }
      this.saveCustomRules()
      return true
    }
    return false
  }

  static deleteCustomRule(ruleId: string): boolean {
    const initialLength = this.customRules.length
    this.customRules = this.customRules.filter((rule) => rule.id !== ruleId)

    if (this.customRules.length !== initialLength) {
      this.saveCustomRules()
      return true
    }
    return false
  }

  static getAllRules(): ProcessingRule[] {
    return [...this.BUILT_IN_RULES, ...this.customRules].filter((rule) => rule.enabled)
  }

  static getCustomRules(): ProcessingRule[] {
    return [...this.customRules]
  }

  static validateRule(rule: Omit<ProcessingRule, "id">): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!rule.name || rule.name.trim().length === 0) {
      errors.push("Rule name is required")
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push("At least one condition is required")
    }

    if (rule.priority < 0 || rule.priority > 100) {
      errors.push("Priority must be between 0 and 100")
    }

    for (const condition of rule.conditions || []) {
      if (condition.weight < 0 || condition.weight > 1) {
        errors.push("Condition weight must be between 0 and 1")
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  private static getApplicableRules(context: any): ProcessingRule[] {
    const allRules = this.getAllRules()
    const applicableRules: ProcessingRule[] = []

    for (const rule of allRules) {
      if (this.evaluateRuleConditions(rule, context)) {
        applicableRules.push(rule)
      }
    }

    return applicableRules
  }

  private static evaluateRuleConditions(rule: ProcessingRule, context: any): boolean {
    let totalWeight = 0
    let matchedWeight = 0

    for (const condition of rule.conditions) {
      totalWeight += condition.weight

      if (this.evaluateCondition(condition, context)) {
        matchedWeight += condition.weight
      }
    }

    // Rule applies if more than 50% of weighted conditions match
    return matchedWeight / totalWeight > 0.5
  }

  private static evaluateCondition(condition: ProcessingCondition, context: any): boolean {
    const contextValue = context[condition.type]

    switch (condition.operator) {
      case "equals":
        return contextValue === condition.value

      case "contains":
        return Array.isArray(contextValue)
          ? contextValue.includes(condition.value)
          : String(contextValue).includes(String(condition.value))

      case "greaterThan":
        return Number(contextValue) > Number(condition.value)

      case "lessThan":
        return Number(contextValue) < Number(condition.value)

      case "in":
        return Array.isArray(condition.value) ? condition.value.includes(contextValue) : false

      case "matches":
        try {
          const regex = new RegExp(condition.value)
          return regex.test(String(contextValue))
        } catch {
          return false
        }

      default:
        return false
    }
  }

  private static calculateRuleConfidence(rule: ProcessingRule, context: any): number {
    let totalWeight = 0
    let matchedWeight = 0

    for (const condition of rule.conditions) {
      totalWeight += condition.weight

      if (this.evaluateCondition(condition, context)) {
        matchedWeight += condition.weight
      }
    }

    return totalWeight > 0 ? matchedWeight / totalWeight : 0
  }

  private static saveCustomRules(): void {
    try {
      localStorage.setItem("custom_processing_rules", JSON.stringify(this.customRules))
    } catch (error) {
      console.error("[v0] Failed to save custom processing rules:", error)
    }
  }

  static loadCustomRules(): void {
    try {
      const stored = localStorage.getItem("custom_processing_rules")
      if (stored) {
        this.customRules = JSON.parse(stored)
      }
    } catch (error) {
      console.error("[v0] Failed to load custom processing rules:", error)
      this.customRules = []
    }
  }
}

// Initialize custom rules on module load
ProcessingRules.loadCustomRules()
