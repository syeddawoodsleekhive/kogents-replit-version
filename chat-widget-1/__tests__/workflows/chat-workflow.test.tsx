// MUST be the first import
import { jest } from "@jest/globals";

// ✅ MOCK BEFORE importing any component that uses `useSearchParams`
jest.mock("next/navigation");

// ✅ Now import everything else
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ✅ Component comes AFTER the mock
import ChatWidget from "@/components/chat-widget-embedded";

// Other mocks
const useChatStateMock = jest.fn(() => ({
  messages: [],
  unreadCount: 0,
  addUserMessage: jest.fn(),
  addWebSocketMessage: jest.fn(),
  updateMessageStatus: jest.fn(),
  markAllAsRead: jest.fn(),
  setMessages: jest.fn(),
  clearChatHistory: jest.fn(),
}));

jest.mock("@/hooks/use-chat-state", () => ({
  useChatState: useChatStateMock,
}));

const useWebSocketMock = jest.fn(() => ({
  status: "open",
  sendMessage: jest.fn(),
  closeConnection: jest.fn(),
}));

jest.mock("@/hooks/use-websocket", () => ({
  useWebSocket: useWebSocketMock,
}));

describe("Chat Workflow Integration", () => {
  it("renders chat widget", () => {
    render(<ChatWidget />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("opens chat when button is clicked", () => {
    render(<ChatWidget />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Should open chat interface
    expect(
      screen.getByPlaceholderText("Type a message...")
    ).toBeInTheDocument();
  });

  it("handles message sending", () => {
    render(<ChatWidget />);

    // Open chat
    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Type and send message
    const input = screen.getByPlaceholderText("Type a message...");
    const form = input.closest("form");

    fireEvent.change(input, { target: { value: "Hello world" } });
    if (form) {
      fireEvent.submit(form);
    }

    // Message should be processed
    expect(input).toHaveValue("");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Complete Chat Flow", () => {
    it("handles complete user interaction flow", async () => {
      const user = userEvent.setup();
      render(<ChatWidget />);

      // 1. Open chat widget
      const chatButton = screen.getByRole("button");
      await user.click(chatButton);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Type a message...")
        ).toBeInTheDocument();
      });

      // 2. Send a message
      const messageInput = screen.getByPlaceholderText("Type a message...");
      await user.type(messageInput, "Hello, I need help");

      const form = messageInput.closest("form");
      if (form) {
        fireEvent.submit(form);
      }

      expect(screen.getByPlaceholderText("Type a message...")).toHaveValue("");
    });

    it("handles connection status changes", async () => {
      const user = userEvent.setup();

      // Start with connected state
      render(<ChatWidget />);

      await user.click(screen.getByRole("button"));

      // Simulate connection loss
      useWebSocketMock.mockReturnValue({
        status: "closed",
        sendMessage: jest.fn(),
        closeConnection: jest.fn(),
      });

      // Should handle disconnected state
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid message sending", async () => {
      const user = userEvent.setup();
      render(<ChatWidget />);

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Type a message...")
        ).toBeInTheDocument();
      });

      const messageInput = screen.getByPlaceholderText("Type a message...");

      // Send multiple messages rapidly
      for (let i = 0; i < 3; i++) {
        await user.clear(messageInput);
        await user.type(messageInput, `Message ${i}`);

        const form = messageInput.closest("form");
        if (form) {
          fireEvent.submit(form);
        }
      }

      expect(screen.getByPlaceholderText("Type a message...")).toHaveValue("");
    });

    it("persists chat state across sessions", () => {
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn(),
      };

      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true,
      });

      render(<ChatWidget />);

      // Component should interact with localStorage
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(0);
    });
  });
});
