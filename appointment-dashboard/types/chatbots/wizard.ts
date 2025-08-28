export interface ChatbotWizardData {
  // Step 1: Basic Info
  name: string
  description: string
  personality: "professional" | "friendly" | "casual" | "technical" | "creative"

  // Step 2: Knowledge Sources
  knowledgeSources: {
    files: File[]
    urls: string[]
    textContent: string
  }

  // Step 3: Appearance
  appearance: {
    avatar: string | null
    primaryColor: string
    secondaryColor: string
    chatBubbleStyle: "rounded" | "square" | "minimal"
    fontFamily: "system" | "modern" | "classic"
  }

  // Step 4: Welcome & Prompts
  welcome: {
    message: string
    initialPrompts: string[]
  }

  // Step 5: Integration
  integration: {
    type: "website" | "whatsapp" | "slack" | "api"
    settings: Record<string, any>
  }
}

export interface WizardStep {
  id: string
  title: string
  description: string
  isComplete: boolean
  isValid: boolean
}

export interface ValidationErrors {
  [key: string]: string[]
}
