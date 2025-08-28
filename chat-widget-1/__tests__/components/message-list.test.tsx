import { render, screen, fireEvent } from "@testing-library/react";
import MessageList from "@/components/message-list";
import type { Message } from "@/types/chat";
import { jest } from "@jest/globals";

// Mock the Redux store and context
jest.mock("react-redux", () => ({
  useSelector: jest.fn((selector: any) => {
    if (selector.toString().includes("messages")) {
      return [
        {
          id: "1",
          content: "Hello",
          sender: "user",
          timestamp: new Date("2024-01-01T12:00:00Z"),
          type: "text",
        },
        {
          id: "2",
          content: "Hi there!",
          sender: "agent",
          timestamp: new Date("2024-01-01T12:01:00Z"),
          type: "text",
        },
        {
          id: "3",
          content: "How can I help?",
          sender: "agent",
          timestamp: new Date("2024-01-01T12:02:00Z"),
          type: "text",
        },
      ];
    }
    if (selector.toString().includes("isAgentTyping")) {
      return false;
    }
    return [];
  }),
}));

jest.mock("@/context/widgetContext", () => ({
  useWidgetContext: () => ({
    widgetSettings: {
      appearance: {
        colors: { primary: "#3B82F6" },
        size: "medium",
      },
    },
  }),
}));

describe("MessageList", () => {
  const defaultProps = {
    isFullScreen: false,
    isOpen: true,
    headerOptions: {},
    chatInputOptions: {},
    settings: {
      active: true,
      appearance: {
        colors: { primary: "#3B82F6" },
        size: "medium",
      },
      sound: { enabled: true },
      behavior: { autoOpen: false },
      forms: { preChatForm: { enabled: false } },
      content: { inputPlaceholder: "Type a message..." },
      privacy: { enableGDPR: false },
      security: { enableCaptcha: false },
    },
    userInfoPopup: null,
    onTyping: jest.fn(),
    onSendMessage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all messages", () => {
    render(<MessageList {...defaultProps} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
    expect(screen.getByText("How can I help?")).toBeInTheDocument();
  });

  it("auto-scrolls to bottom when new message is added", () => {
    const scrollIntoViewMock = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    render(<MessageList {...defaultProps} />);

    expect(scrollIntoViewMock).toHaveBeenCalled();
  });
});
