interface Window {
  KogentsChatWidget?: {
    open: () => void
    close: () => void
    toggle: () => void
    isOpen: () => Promise<boolean>
    identify: (userData: any) => void
    updateConfig: (config: any) => void
    on: (event: string, callback: (data?: any) => void) => () => void
    off: (event: string, callback?: (data?: any) => void) => void
  }
}
