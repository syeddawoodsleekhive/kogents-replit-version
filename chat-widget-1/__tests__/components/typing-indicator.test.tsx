import { render, screen } from "@testing-library/react"
import TypingIndicator from "@/components/typing-indicator"
import { act } from "react-dom/test-utils"

describe("TypingIndicator", () => {
  it("renders when typing is true", () => {
    render(<TypingIndicator isTyping={true} />)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("does not render when typing is false", () => {
    render(<TypingIndicator isTyping={false} />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("has proper accessibility attributes", () => {
    render(<TypingIndicator isTyping={true} />)
    const indicator = screen.getByRole("status")
    expect(indicator).toHaveAttribute("aria-label")
  })

  it("renders animation wrapper when typing is true", () => {
    render(<TypingIndicator isTyping={true} />)
    const indicator = screen.getByRole("status")
    // Ensure animation classes or styles exist
    expect(indicator.className).toMatch(/animate|transition|fade|pulse/i)
  })

  it("supports animation lifecycle without errors", () => {
    jest.useFakeTimers()
    render(<TypingIndicator isTyping={true} />)
    // Simulate animation frame updates
    act(() => {
      jest.advanceTimersByTime(500)
    })
    expect(screen.getByRole("status")).toBeInTheDocument()
    jest.useRealTimers()
  })
})
