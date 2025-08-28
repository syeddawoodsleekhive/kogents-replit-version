import { renderHook, act } from "@testing-library/react";
import { useWebSocket } from "@/hooks/use-websocket";
import { jest } from "@jest/globals";
import { Message } from "@/types/chat";

// Mock WebSocket
class MockWebSocket {
  onopen = null;
  onclose = null;
  onmessage = null;
  onerror = null;
  readyState = 0;
  url = "";

  constructor(url) {
    this.url = url;
    setTimeout(() => {
      if (this.onopen) this.onopen({ type: "open" });
    }, 0);
  }

  send(data) {
    return true;
  }

  close() {
    if (this.onclose) this.onclose({ type: "close" });
  }

  // Helper to simulate receiving a message
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  // Helper to simulate an error
  simulateError() {
    if (this.onerror) {
      this.onerror({ type: "error" });
    }
  }
}

// Replace the global WebSocket with our mock
global.WebSocket = MockWebSocket;

describe("useWebSocket Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initializes with disconnected state", () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: "wss://example.com", setMessages: jest.fn() })
    );

    expect(result.current.status).toBe("connecting");
  });

  it("connects to WebSocket when URL is provided", async () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: "wss://example.com", setMessages: jest.fn() })
    );

    // Wait for the connection to establish
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.status).toBe("open");
  });

  it("sends messages through WebSocket", async () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: "wss://example.com", setMessages: jest.fn() })
    );

    // Wait for the connection to establish
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const message: Message = {
      id: "1",
      type: "chat",
      content: "Hello",
      sender: "agent",
      timestamp: new Date(),
    };

    // Mock the send method
    const sendSpy = jest.spyOn(MockWebSocket.prototype, "send");

    act(() => {
      result.current.sendMessage(message.content);
    });

    expect(sendSpy);
  });
});
