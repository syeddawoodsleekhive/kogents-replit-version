"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useMemoryManagement } from "./useMemoryManagement"
import type { ChatbotWizardData, WizardStep, ValidationErrors } from "@/types/chatbots/wizard"

const STORAGE_KEY = "chatbot-wizard-draft"
const AUTO_SAVE_DELAY = 2000 // 2 seconds

const INITIAL_DATA: ChatbotWizardData = {
  name: "",
  description: "",
  personality: "friendly",
  knowledgeSources: {
    files: [],
    urls: [],
    textContent: "",
  },
  appearance: {
    avatar: null,
    primaryColor: "#3b82f6",
    secondaryColor: "#f1f5f9",
    chatBubbleStyle: "rounded",
    fontFamily: "system",
  },
  welcome: {
    message: "Hello! How can I help you today?",
    initialPrompts: ["How can I get started?", "Tell me about your services", "I need help with..."],
  },
  integration: {
    type: "website",
    settings: {},
  },
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "basic-info",
    title: "Basic Information",
    description: "Set up your chatbot's name and personality",
    isComplete: false,
    isValid: false,
  },
  {
    id: "knowledge-sources",
    title: "Knowledge Sources",
    description: "Upload training data and content",
    isComplete: false,
    isValid: false,
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Customize the look and feel",
    isComplete: false,
    isValid: false,
  },
  {
    id: "welcome-setup",
    title: "Welcome & Prompts",
    description: "Configure initial interactions",
    isComplete: false,
    isValid: false,
  },
  {
    id: "integration",
    title: "Integration",
    description: "Choose how to deploy your chatbot",
    isComplete: false,
    isValid: false,
  },
]

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function useOptimizedWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<ChatbotWizardData>(INITIAL_DATA)
  const [steps, setSteps] = useState<WizardStep[]>(WIZARD_STEPS)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isDraft, setIsDraft] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const memoryManager = useMemoryManagement()
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const dataRef = useRef(data)

  // Update ref when data changes
  useEffect(() => {
    dataRef.current = data
  }, [data])

  // Load draft from localStorage on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const savedDraft = localStorage.getItem(STORAGE_KEY)
        if (savedDraft) {
          const parsedData = JSON.parse(savedDraft)
          // Validate the loaded data structure
          if (parsedData && typeof parsedData === "object") {
            setData({ ...INITIAL_DATA, ...parsedData })
            setIsDraft(true)
          }
        }
      } catch (error) {
        console.error("Failed to load draft:", error)
        localStorage.removeItem(STORAGE_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    loadDraft()
  }, [])

  // Auto-save functionality
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataRef.current))
        setIsDraft(true)
      } catch (error) {
        console.warn("Failed to auto-save draft:", error)
      }
    }, AUTO_SAVE_DELAY)
  }, [])

  // Cleanup auto-save timeout
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Validation functions
  const validateBasicInfo = useCallback((data: ChatbotWizardData): ValidationResult => {
    const errors: string[] = []

    if (!data.name?.trim()) {
      errors.push("Chatbot name is required")
    } else if (data.name.trim().length < 2) {
      errors.push("Chatbot name must be at least 2 characters long")
    } else if (data.name.trim().length > 50) {
      errors.push("Chatbot name must be less than 50 characters")
    }

    if (!data.description?.trim()) {
      errors.push("Description is required")
    } else if (data.description.trim().length < 10) {
      errors.push("Description must be at least 10 characters long")
    } else if (data.description.trim().length > 500) {
      errors.push("Description must be less than 500 characters")
    }

    if (!data.personality) {
      errors.push("Personality is required")
    }

    return { isValid: errors.length === 0, errors }
  }, [])

  const validateKnowledgeSources = useCallback((data: ChatbotWizardData): ValidationResult => {
    const errors: string[] = []
    const { files, urls, textContent } = data.knowledgeSources

    const hasFiles = files.length > 0
    const hasUrls = urls.length > 0
    const hasText = textContent.trim().length > 0

    if (!hasFiles && !hasUrls && !hasText) {
      errors.push("At least one knowledge source is required (files, URLs, or text content)")
    }

    // Validate files
    files.forEach((file, index) => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        errors.push(`File "${file.name}" is too large (max 10MB)`)
      }

      const allowedTypes = [
        "text/plain",
        "application/pdf",
        "text/csv",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      const allowedExtensions = [".md", ".txt", ".pdf", ".csv", ".docx"]

      const hasValidType = allowedTypes.includes(file.type)
      const hasValidExtension = allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

      if (!hasValidType && !hasValidExtension) {
        errors.push(`File "${file.name}" has an unsupported format`)
      }
    })

    // Validate URLs
    urls.forEach((url, index) => {
      try {
        const urlObj = new URL(url)
        if (!["http:", "https:"].includes(urlObj.protocol)) {
          errors.push(`URL ${index + 1} must use HTTP or HTTPS protocol`)
        }
      } catch {
        errors.push(`URL ${index + 1} is not valid: ${url}`)
      }
    })

    // Validate text content
    if (hasText) {
      if (textContent.trim().length < 10) {
        errors.push("Text content must be at least 10 characters long")
      } else if (textContent.trim().length > 50000) {
        errors.push("Text content must be less than 50,000 characters")
      }
    }

    return { isValid: errors.length === 0, errors }
  }, [])

  const validateAppearance = useCallback((data: ChatbotWizardData): ValidationResult => {
    const errors: string[] = []
    const { primaryColor, secondaryColor, chatBubbleStyle, fontFamily } = data.appearance

    if (!primaryColor) {
      errors.push("Primary color is required")
    } else if (!/^#[0-9A-F]{6}$/i.test(primaryColor)) {
      errors.push("Primary color must be a valid hex color")
    }

    if (!secondaryColor) {
      errors.push("Secondary color is required")
    } else if (!/^#[0-9A-F]{6}$/i.test(secondaryColor)) {
      errors.push("Secondary color must be a valid hex color")
    }

    if (!chatBubbleStyle) {
      errors.push("Chat bubble style is required")
    }

    if (!fontFamily) {
      errors.push("Font family is required")
    }

    return { isValid: errors.length === 0, errors }
  }, [])

  const validateWelcomeSetup = useCallback((data: ChatbotWizardData): ValidationResult => {
    const errors: string[] = []
    const { message, initialPrompts } = data.welcome

    if (!message?.trim()) {
      errors.push("Welcome message is required")
    } else if (message.trim().length < 5) {
      errors.push("Welcome message must be at least 5 characters long")
    } else if (message.trim().length > 200) {
      errors.push("Welcome message must be less than 200 characters")
    }

    if (!initialPrompts || initialPrompts.length === 0) {
      errors.push("At least one initial prompt is required")
    } else {
      initialPrompts.forEach((prompt, index) => {
        if (!prompt.trim()) {
          errors.push(`Initial prompt ${index + 1} cannot be empty`)
        } else if (prompt.trim().length > 100) {
          errors.push(`Initial prompt ${index + 1} must be less than 100 characters`)
        }
      })
    }

    return { isValid: errors.length === 0, errors }
  }, [])

  const validateIntegration = useCallback((data: ChatbotWizardData): ValidationResult => {
    const errors: string[] = []
    const { type, settings } = data.integration

    if (!type) {
      errors.push("Integration type is required")
    }

    // Add specific validation based on integration type
    if (type === "api" && (!settings.apiKey || !settings.endpoint)) {
      errors.push("API integration requires API key and endpoint")
    }

    return { isValid: errors.length === 0, errors }
  }, [])

  // Main validation function
  const validateStep = useCallback(
    (stepIndex: number, dataToValidate: ChatbotWizardData): ValidationResult => {
      switch (stepIndex) {
        case 0:
          return validateBasicInfo(dataToValidate)
        case 1:
          return validateKnowledgeSources(dataToValidate)
        case 2:
          return validateAppearance(dataToValidate)
        case 3:
          return validateWelcomeSetup(dataToValidate)
        case 4:
          return validateIntegration(dataToValidate)
        default:
          return { isValid: true, errors: [] }
      }
    },
    [validateBasicInfo, validateKnowledgeSources, validateAppearance, validateWelcomeSetup, validateIntegration],
  )

  // Memoized step validations
  const stepValidations = useMemo(() => {
    return WIZARD_STEPS.map((_, index) => validateStep(index, data))
  }, [data, validateStep])

  // Update errors when validations change
  useEffect(() => {
    const newErrors: ValidationErrors = {}
    stepValidations.forEach((validation, index) => {
      const stepId = WIZARD_STEPS[index].id
      newErrors[stepId] = validation.errors
    })
    setErrors(newErrors)
  }, [stepValidations])

  // Update steps with completion status
  useEffect(() => {
    setSteps((prev) =>
      prev.map((step, index) => ({
        ...step,
        isValid: stepValidations[index].isValid,
        isComplete: index < currentStep || (index === currentStep && stepValidations[index].isValid),
      })),
    )
  }, [currentStep, stepValidations])

  // Data update function with auto-save
  const updateData = useCallback(
    (updates: Partial<ChatbotWizardData>) => {
      setData((prev) => {
        const newData = { ...prev, ...updates }

        // Deep merge for nested objects
        if (updates.knowledgeSources) {
          newData.knowledgeSources = { ...prev.knowledgeSources, ...updates.knowledgeSources }
        }
        if (updates.appearance) {
          newData.appearance = { ...prev.appearance, ...updates.appearance }
        }
        if (updates.welcome) {
          newData.welcome = { ...prev.welcome, ...updates.welcome }
        }
        if (updates.integration) {
          newData.integration = { ...prev.integration, ...updates.integration }
        }

        return newData
      })

      scheduleAutoSave()
    },
    [scheduleAutoSave],
  )

  // Navigation functions
  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setCurrentStep(stepIndex)
      }
    },
    [steps.length],
  )

  const nextStep = useCallback(() => {
    const isCurrentStepValid = stepValidations[currentStep]?.isValid
    if (isCurrentStepValid && currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }, [currentStep, steps.length, stepValidations])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  // Draft management
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setIsDraft(true)
    } catch (error) {
      console.error("Failed to save draft:", error)
    }
  }, [data])

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setIsDraft(false)
      setData(INITIAL_DATA)
      setCurrentStep(0)
    } catch (error) {
      console.warn("Failed to clear draft:", error)
    }
  }, [])

  // Reset wizard
  const resetWizard = useCallback(() => {
    setData(INITIAL_DATA)
    setCurrentStep(0)
    clearDraft()
  }, [clearDraft])

  // Computed values
  const canGoNext = stepValidations[currentStep]?.isValid ?? false
  const canGoPrev = currentStep > 0
  const isLastStep = currentStep === steps.length - 1
  const currentStepData = steps[currentStep]
  const currentStepErrors = errors[steps[currentStep]?.id] || []
  const completionPercentage = Math.round((steps.filter((step) => step.isComplete).length / steps.length) * 100)

  return {
    // State
    currentStep,
    data,
    steps,
    errors,
    isDraft,
    isLoading,

    // Computed
    canGoNext,
    canGoPrev,
    isLastStep,
    currentStepData,
    currentStepErrors,
    completionPercentage,

    // Actions
    updateData,
    goToStep,
    nextStep,
    prevStep,
    validateStep: (stepIndex: number) => validateStep(stepIndex, data),
    saveDraft,
    clearDraft,
    resetWizard,
  }
}
