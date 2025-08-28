import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Combine class names with Tailwind merging
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Animation Utilities ---

// Delay helper for async animations
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Standard easing functions (CSS-like)
export const easing = {
  easeInOutCubic: "cubic-bezier(0.645, 0.045, 0.355, 1.000)",
  easeOutQuad: "cubic-bezier(0.250, 0.460, 0.450, 0.940)",
  easeInQuad: "cubic-bezier(0.550, 0.085, 0.680, 0.530)",
}

// Trigger reflow (forces browser to recalculate styles) — useful for restarting CSS animations
export function forceReflow(element: HTMLElement) {
  void element.offsetHeight
}

// Runs a callback after the next animation frame
export function nextFrame(callback: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback)
  })
}
