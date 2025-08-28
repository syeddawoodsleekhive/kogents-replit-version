"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Globe } from "lucide-react"
import { useLanguage } from "@/context/language-context"
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/languages"
import type { SupportedLanguage } from "@/lib/i18n/types"
import { cn } from "@/lib/utils"

interface LanguageSelectorProps {
  className?: string
  compact?: boolean
}

export function LanguageSelector({ className, compact = false }: LanguageSelectorProps) {
  const { currentLanguage, setLanguage, isRTL } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('left')

  // Calculate dropdown position to prevent overflow
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const dropdownWidth = 192 // w-48 = 12rem = 192px
      
      // Check if dropdown would overflow right edge
      if (buttonRect.left + dropdownWidth > viewportWidth - 16) {
        setDropdownPosition('right')
      } else {
        setDropdownPosition('left')
      }
    }
  }, [isOpen])

  // Add window resize listener to recalculate position
  useEffect(() => {
    const handleResize = () => {
      if (isOpen && buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const dropdownWidth = 192
        
        if (buttonRect.left + dropdownWidth > viewportWidth - 16) {
          setDropdownPosition('right')
        } else {
          setDropdownPosition('left')
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen])

  const getDropdownPosition = () => {
    if (isRTL) {
      return { right: '0' }
    }
    return dropdownPosition === 'right' ? { right: '0' } : { left: '0' }
  }

  const getDropdownStyles = () => {
    const baseStyles = {
      maxWidth: 'min(12rem, calc(100vw - 2rem))',
      position: 'absolute' as const,
      zIndex: 20,
      marginTop: '0.25rem',
      width: '12rem',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '0.375rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      maxHeight: '15rem',
      overflow: 'auto'
    }

    if (isRTL) {
      return { ...baseStyles, right: '0' }
    }
    
    return dropdownPosition === 'right' 
      ? { ...baseStyles, right: '0' }
      : { ...baseStyles, left: '0' }
  }

  const handleLanguageChange = (language: SupportedLanguage) => {
    setLanguage(language)
    setIsOpen(false)
  }

  const currentLangConfig = SUPPORTED_LANGUAGES[currentLanguage]

  return (
    <div className={cn("relative", className)} style={{ overflow: 'visible' }}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors",
          isRTL && "flex-row-reverse",
          compact && "px-2 py-1",
        )}
        aria-label={`Current language: ${currentLangConfig.nativeName}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="h-4 w-4" />
        {!compact && <span className="font-medium">{currentLangConfig.nativeName}</span>}
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden="true" />

          {/* Dropdown */}
          <div
            role="listbox"
            aria-label="Select language"
            style={getDropdownStyles()}
          >
            {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  "w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors flex items-center justify-between",
                  currentLanguage === lang.code && "bg-blue-50 text-blue-600",
                  isRTL && "text-right",
                )}
                role="option"
                aria-selected={currentLanguage === lang.code}
              >
                <span className="font-medium">{lang.nativeName}</span>
                <span className="text-sm text-gray-500">{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
