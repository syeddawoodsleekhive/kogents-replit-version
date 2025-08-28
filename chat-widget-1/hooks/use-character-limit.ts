"use client"

import { useMemo } from "react"

interface CharacterLimitConfig {
  softLimit: number
  hardLimit: number
  showCounterAt: number // Percentage of soft limit to show counter
  warningAt: number // Percentage of soft limit to show warning
  errorAt: number // Percentage of soft limit to show error
}

interface CharacterLimitState {
  count: number
  remaining: number
  isApproachingLimit: boolean
  isAtWarning: boolean
  isAtError: boolean
  isAtHardLimit: boolean
  shouldShowCounter: boolean
  warningMessage?: string
}

const DEFAULT_CONFIG: CharacterLimitConfig = {
  softLimit: 1000,
  hardLimit: 2000,
  showCounterAt: 80, // Show counter at 80% of soft limit
  warningAt: 90, // Warning at 90% of soft limit
  errorAt: 100, // Error at 100% of soft limit (hard limit)
}

export function useCharacterLimit(text: string, config: Partial<CharacterLimitConfig> = {}): CharacterLimitState {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const state = useMemo(() => {
    const count = text.length
    const softRemaining = finalConfig.softLimit - count
    const hardRemaining = finalConfig.hardLimit - count

    const softPercentage = (count / finalConfig.softLimit) * 100
    const hardPercentage = (count / finalConfig.hardLimit) * 100

    const shouldShowCounter = softPercentage >= finalConfig.showCounterAt
    const isApproachingLimit = softPercentage >= finalConfig.showCounterAt
    const isAtWarning = softPercentage >= finalConfig.warningAt
    const isAtError = hardPercentage >= finalConfig.errorAt
    const isAtHardLimit = count >= finalConfig.hardLimit

    let warningMessage: string | undefined

    if (isAtHardLimit) {
      warningMessage = `Maximum character limit reached (${finalConfig.hardLimit})`
    } else if (isAtError) {
      warningMessage = `Approaching maximum limit (${hardRemaining} characters remaining)`
    } else if (isAtWarning) {
      warningMessage = `Approaching character limit (${softRemaining} characters remaining)`
    }

    return {
      count,
      remaining: softRemaining,
      isApproachingLimit,
      isAtWarning,
      isAtError,
      isAtHardLimit,
      shouldShowCounter,
      warningMessage,
    }
  }, [text]) // Removed finalConfig from dependencies

  return state
}
