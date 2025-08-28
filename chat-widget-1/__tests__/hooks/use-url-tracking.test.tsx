import { renderHook, act } from "@testing-library/react"
import { useURLTracking } from "@/hooks/use-url-tracking"
import { jest } from "@jest/globals"

// Mock window.location and history
const mockLocation = {
  href: "https://example.com/page1?token=secret123&user_id=456",
  pathname: "/page1",
  search: "?token=secret123&user_id=456",
  hash: "",
}

const mockHistory = {
  pushState: jest.fn(),
  replaceState: jest.fn(),
}

// Mock parent window
const mockParent = {
  location: mockLocation,
  history: mockHistory,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}

Object.defineProperty(window, "parent", {
  value: mockParent,
  writable: true,
})

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
})

Object.defineProperty(window, "history", {
  value: mockHistory,
  writable: true,
})

describe("useURLTracking Security Features", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("sanitizes sensitive parameters from URLs", () => {
    const onURLChange = jest.fn()
    const { result } = renderHook(() => useURLTracking({ onURLChange, debounceMs: 100 }))

    // The initial URL should have sensitive params removed
    act(() => {
      jest.advanceTimersByTime(150)
    })

    expect(result.current.currentUrl).not.toContain("token=secret123")
    expect(result.current.currentUrl).not.toContain("user_id=456")
  })

  it("truncates long URLs", () => {
    const longUrl = "https://example.com/" + "a".repeat(300)
    mockLocation.href = longUrl

    const onURLChange = jest.fn()
    const { result } = renderHook(() => useURLTracking({ onURLChange, debounceMs: 100, maxUrlLength: 50 }))

    act(() => {
      result.current.checkForURLChange()
      jest.advanceTimersByTime(150)
    })

    expect(result.current.currentUrl.length).toBeLessThanOrEqual(50)
    expect(result.current.currentUrl).toContain("...")
  })

  it("handles rate limiting", () => {
    const onURLChange = jest.fn()
    const { result } = renderHook(() => useURLTracking({ onURLChange, debounceMs: 10, maxChangesPerMinute: 2 }))

    // Trigger multiple rapid changes
    act(() => {
      for (let i = 0; i < 5; i++) {
        mockLocation.href = `https://example.com/page${i}`
        result.current.checkForURLChange()
        jest.advanceTimersByTime(20)
      }
    })

    expect(result.current.isRateLimited).toBe(true)
  })

  it("validates URLs and rejects invalid ones", () => {
    const onURLChange = jest.fn()
    const { result } = renderHook(() => useURLTracking({ onURLChange, debounceMs: 100 }))

    // Set invalid URL
    act(() => {
      mockLocation.href = "not-a-valid-url"
      result.current.checkForURLChange()
      jest.advanceTimersByTime(150)
    })

    expect(onURLChange).not.toHaveBeenCalled()
  })

  it("respects domain allowlist", () => {
    const onURLChange = jest.fn()
    const { result } = renderHook(() =>
      useURLTracking({
        onURLChange,
        debounceMs: 100,
        allowedDomains: ["allowed.com"],
      }),
    )

    // URL from disallowed domain should be ignored
    act(() => {
      mockLocation.href = "https://example.com/page1"
      result.current.checkForURLChange()
      jest.advanceTimersByTime(150)
    })

    expect(result.current.currentUrl).toBe("")
  })

  it("handles errors gracefully and tracks error count", () => {
    // Mock URL constructor to throw error
    const originalURL = global.URL
    global.URL = jest.fn(() => {
      throw new Error("Invalid URL")
    }) as any

    const onURLChange = jest.fn()
    const { result } = renderHook(() => useURLTracking({ onURLChange, debounceMs: 100 }))

    act(() => {
      result.current.checkForURLChange()
      jest.advanceTimersByTime(150)
    })

    expect(result.current.errorCount).toBeGreaterThan(0)

    // Restore original URL constructor
    global.URL = originalURL
  })

  it("removes PII patterns from URLs", () => {
    const urlWithEmail = "https://example.com/user/john.doe@email.com/profile"
    mockLocation.href = urlWithEmail

    const onURLChange = jest.fn()
    const { result } = renderHook(() => useURLTracking({ onURLChange, debounceMs: 100 }))

    act(() => {
      result.current.checkForURLChange()
      jest.advanceTimersByTime(150)
    })

    expect(result.current.currentUrl).toContain("[REDACTED]")
    expect(result.current.currentUrl).not.toContain("john.doe@email.com")
  })

  it("disables tracking after too many errors", () => {
    // Mock to always throw errors
    const originalURL = global.URL
    global.URL = jest.fn(() => {
      throw new Error("Persistent error")
    }) as any

    const onURLChange = jest.fn()
    const { result } = renderHook(() => useURLTracking({ onURLChange, debounceMs: 10 }))

    // Trigger many errors
    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.checkForURLChange()
        jest.advanceTimersByTime(20)
      }
    })

    expect(result.current.isTracking).toBe(false)

    // Restore original URL constructor
    global.URL = originalURL
  })
})
