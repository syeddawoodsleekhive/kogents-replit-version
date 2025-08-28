import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import MessageItem from "@/components/message-item";
import { jest } from "@jest/globals";
import { Message } from "@/types/chat";

// Mock the necessary dependencies
jest.mock("@/lib/renderMarkdown", () => ({
  renderMarkdown: (text: any) => text,
}));

describe("MessageItem Component", () => {
  const mockMessage: Message = {
    id: "1",
    content: "Hello world",
    sender: "user",
    timestamp: new Date(),
    status: "sent",
  };

  it("renders user message correctly", () => {
    render(<MessageItem message={mockMessage} />);

    expect(screen.getByText("Hello world")).toBeInTheDocument();
    const messageContainer = screen.getByText("Hello world").closest("div");
    expect(messageContainer).toBeInTheDocument();
  });

  it("renders agent message correctly", () => {
    const agentMessage: Message = { ...mockMessage, sender: "agent" };
    render(<MessageItem message={agentMessage} />);

    expect(screen.getByText("Hello world")).toBeInTheDocument();
    const messageContainer = screen.getByText("Hello world").closest("div");
    expect(messageContainer).toBeInTheDocument();
  });

  it("renders system message correctly", () => {
    const systemMessage: Message = { ...mockMessage, sender: "system" };
    render(<MessageItem message={systemMessage} />);

    expect(screen.getByText("Hello world")).toBeInTheDocument();
    const messageContainer = screen.getByText("Hello world").closest("div");
    expect(messageContainer).toBeInTheDocument();
  });

  it("renders message with file attachment if present", () => {
    const messageWithFile: Message = {
      ...mockMessage,
      attachment: {
        name: "test.pdf",
        type: "application/pdf",
        size: 1024,
        url: "https://example.com/test.pdf",
      },
    };

    render(<MessageItem message={messageWithFile} />);

    expect(screen.getByText(/test\.pdf/i)).toBeInTheDocument();
  });

  it("renders formatted time for the message", () => {
    // Use a fixed date for predictable output
    const fixedDate = new Date("2023-01-01T15:45:00Z");
    const messageWithTime: Message = { ...mockMessage, timestamp: fixedDate };
    render(<MessageItem message={messageWithTime} />);
    // The formatTime function uses en-US 12-hour format
    // Depending on timezone, this may be 3:45 PM or 10:45 AM, so match regex
    expect(screen.getByText(/\d{1,2}:\d{2} (AM|PM)/)).toBeInTheDocument();
  });

  // it("renders read receipt for user message with status", () => {
  //   render(<MessageItem message={mockMessage} />);
  //   // Check for the icon by test id
  //   expect(screen.getByTestId('read-receipt-icon')).toBeInTheDocument();
  // });

  it("renders system message with 'disconnected' keyword and correct icon/class", () => {
    const systemMessage: Message = { ...mockMessage, sender: "system", content: "You have been disconnected" };
    render(<MessageItem message={systemMessage} />);
    expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
    // Check for WifiOff icon by role or SVG
    expect(screen.getByTestId('lucide-wifi-off')).toBeInTheDocument();
  });

  it("renders system message with 'reconnection' keyword and correct icon/class", () => {
    const systemMessage: Message = { ...mockMessage, sender: "system", content: "Attempting reconnection" };
    render(<MessageItem message={systemMessage} />);
    expect(screen.getByText(/reconnection/i)).toBeInTheDocument();
    expect(screen.getByTestId('lucide-wifi')).toBeInTheDocument();
  });

  it("renders system message with 'connecting' keyword and correct icon/class", () => {
    const systemMessage: Message = { ...mockMessage, sender: "system", content: "Connecting to server" };
    render(<MessageItem message={systemMessage} />);
    expect(screen.getByText(/connecting/i)).toBeInTheDocument();
    expect(screen.getByTestId('lucide-wifi')).toBeInTheDocument();
  });

  it("renders system message with 'connected' keyword and correct icon/class", () => {
    const systemMessage: Message = { ...mockMessage, sender: "system", content: "You are now connected" };
    render(<MessageItem message={systemMessage} />);
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
    expect(screen.getByTestId('lucide-wifi')).toBeInTheDocument();
  });

  it("renders system message with 'agent left' keyword and correct icon/class", () => {
    const systemMessage: Message = { ...mockMessage, sender: "system", content: "Agent left the chat" };
    render(<MessageItem message={systemMessage} />);
    expect(screen.getByText(/agent left/i)).toBeInTheDocument();
    expect(screen.getByTestId('lucide-user-x')).toBeInTheDocument();
  });

  it("renders system message with 'agent has joined' keyword and correct icon/class", () => {
    const systemMessage: Message = { ...mockMessage, sender: "system", content: "Agent has joined the chat" };
    render(<MessageItem message={systemMessage} />);
    expect(screen.getByText(/has joined/i)).toBeInTheDocument();
    expect(screen.getByTestId('lucide-user')).toBeInTheDocument();
  });

  it("renders agent name if present", () => {
    const agentMessage: Message = { ...mockMessage, sender: "agent", name: "Agent Smith" };
    render(<MessageItem message={agentMessage} />);
    expect(screen.getByText("Agent Smith")).toBeInTheDocument();
  });

  it("renders live-agent avatar icon", () => {
    const liveAgentMessage: Message = { ...mockMessage, sender: "live-agent" };
    render(<MessageItem message={liveAgentMessage} />);
    // Should render User icon (lucide-user)
    expect(screen.getByTestId('lucide-user')).toBeInTheDocument();
  });
});
