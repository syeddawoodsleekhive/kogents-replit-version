// Redux store configuration and types

export interface RootReducerState {
  // Add your state shape here
  chat: {
    messages: any[]
    isConnected: boolean
    isTyping: boolean
  }
  ui: {
    isOpen: boolean
    isFullScreen: boolean
  }
}

export type AppReducerDispatch = (action: any) => void

// Placeholder for future Redux implementation
export const store = null
export const useAppSelector = null
export const useAppDispatch = null
