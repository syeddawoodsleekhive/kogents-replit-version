"use client"

import { useState, useEffect, useCallback } from "react"

interface DraftData {
  content: string
  timestamp: number
  sessionId: string
}

interface UseDraftPersistenceOptions {
  sessionId: string
  autoSaveDelay?: number
  maxAge?: number
  respectPrivacy?: boolean
}

export function useDraftPersistence({
  sessionId,
  autoSaveDelay = 2000,
  maxAge = 24 * 60 * 60 * 1000, // 24 hours
  respectPrivacy = true,
}: UseDraftPersistenceOptions) {
  const [draftContent, setDraftContent] = useState<string>("")
  const [hasDraft, setHasDraft] = useState<boolean>(false)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  const storageKey = `chat_draft_${sessionId}`

  // Check if local storage is available and privacy settings allow
  const isStorageAvailable = useCallback(() => {
    if (respectPrivacy && typeof window !== "undefined") {
      // Check for GDPR consent or privacy settings
      const gdprConsent = localStorage.getItem("gdpr_consent")
      if (gdprConsent === "false") return false
    }

    try {
      return typeof window !== "undefined" && "localStorage" in window
    } catch {
      return false
    }
  }, [respectPrivacy])

  // Load draft on mount
  useEffect(() => {
    if (!isStorageAvailable()) return

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const draft: DraftData = JSON.parse(stored)

        // Check if draft is not too old
        if (Date.now() - draft.timestamp < maxAge) {
          setDraftContent(draft.content)
          setHasDraft(true)
        } else {
          // Remove expired draft
          localStorage.removeItem(storageKey)
        }
      }
    } catch (error) {
      console.warn("Failed to load draft:", error)
    }
  }, [storageKey, maxAge, isStorageAvailable])

  // Save draft with debouncing
  const saveDraft = useCallback(
    (content: string) => {
      if (!isStorageAvailable() || !content.trim()) return

      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }

      const timeout = setTimeout(() => {
        try {
          const draft: DraftData = {
            content: content.trim(),
            timestamp: Date.now(),
            sessionId,
          }
          localStorage.setItem(storageKey, JSON.stringify(draft))
        } catch (error) {
          console.warn("Failed to save draft:", error)
        }
      }, autoSaveDelay)

      setAutoSaveTimeout(timeout)
    },
    [storageKey, sessionId, autoSaveDelay, autoSaveTimeout, isStorageAvailable],
  )

  // Clear draft
  const clearDraft = useCallback(() => {
    if (!isStorageAvailable()) return

    try {
      localStorage.removeItem(storageKey)
      setDraftContent("")
      setHasDraft(false)
    } catch (error) {
      console.warn("Failed to clear draft:", error)
    }
  }, [storageKey, isStorageAvailable])

  // Cleanup old drafts
  const cleanupOldDrafts = useCallback(() => {
    if (!isStorageAvailable()) return

    try {
      const keys = Object.keys(localStorage)
      const draftKeys = keys.filter((key) => key.startsWith("chat_draft_"))

      draftKeys.forEach((key) => {
        try {
          const stored = localStorage.getItem(key)
          if (stored) {
            const draft: DraftData = JSON.parse(stored)
            if (Date.now() - draft.timestamp > maxAge) {
              localStorage.removeItem(key)
            }
          }
        } catch {
          // Remove corrupted drafts
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn("Failed to cleanup old drafts:", error)
    }
  }, [maxAge, isStorageAvailable])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
      cleanupOldDrafts()
    }
  }, [autoSaveTimeout, cleanupOldDrafts])

  return {
    draftContent,
    hasDraft,
    saveDraft,
    clearDraft,
    isStorageAvailable: isStorageAvailable(),
  }
}
