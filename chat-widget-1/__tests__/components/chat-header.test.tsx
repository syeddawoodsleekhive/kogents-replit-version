"use client";
import { render, screen, fireEvent } from "@testing-library/react";
import ChatHeader, { ChatHeaderProps } from "@/components/chat-header";
import { jest } from "@jest/globals";
import { Message } from "@/types/chat";

describe("ChatHeader", () => {
  const defaultProps: ChatHeaderProps = {
    isOnline: true,
    wsStatus: "open",
    onClose: jest.fn(),
    onDownloadTranscript: jest.fn(),
    isFullScreen: false,
    toggleFullScreen: jest.fn(),
    messages: [],
    roomId: "test-room",
    agentData: null,
    setAgentData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header with online status", () => {
    render(<ChatHeader {...defaultProps} isOnline={true} wsStatus="open" />);

    expect(screen.getByText(/online/i)).toBeInTheDocument();
  });

  it("renders header with offline status", () => {
    render(<ChatHeader {...defaultProps} isOnline={false} wsStatus="closed" />);

    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const mockOnClose = jest.fn();
    render(<ChatHeader {...defaultProps} onClose={mockOnClose} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onMinimize when minimize button is clicked", () => {
    const mockOnMinimize = jest.fn();
    render(<ChatHeader {...defaultProps} onClose={mockOnMinimize} />);

    const minimizeButton = screen.getByRole("button", { name: /close chat/i });
    fireEvent.click(minimizeButton);

    expect(mockOnMinimize).toHaveBeenCalledTimes(1);
  });

  it("calls getChats when agent has joined", () => {
    const getChatsMock = jest.fn((roomId, cb) => {
      cb({ agent: { name: "Agent Smith" } });
    });

    jest.mock("@/app/api/chat", () => ({
      getChats: getChatsMock,
    }));

    const messages: Message[] = [
      {
        id: "1",
        sender: "system",
        content: "has joined the chat",
        timestamp: new Date(),
        type: "text",
      },
    ];

    render(<ChatHeader {...defaultProps} messages={messages} />);

    expect(getChatsMock).toHaveBeenCalledTimes(0);
  });

  it("calls getChats when agent has joined", () => {
    const getChatsMock = jest.fn((roomId, cb) => {
      cb({ agent: { name: "Agent Smith" } });
    });

    jest.mock("@/app/api/chat", () => ({
      getChats: getChatsMock,
    }));

    const messages: Message[] = [
      {
        id: "1",
        sender: "system",
        content: "agent left",
        timestamp: new Date(),
        type: "text",
      },
    ];

    render(<ChatHeader {...defaultProps} messages={messages} />);

    expect(getChatsMock).toHaveBeenCalledTimes(0);
  });

  it("toggles fullscreen mode", () => {
    const mockToggleFullscreen = jest.fn();
    render(
      <ChatHeader {...defaultProps} toggleFullScreen={mockToggleFullscreen} />
    );

    const fullscreenButton = screen.getByRole("button", {
      name: /full screen/i,
    });
    fireEvent.click(fullscreenButton);

    expect(mockToggleFullscreen).toHaveBeenCalledTimes(1);
  });

  it("shows correct fullscreen icon when in fullscreen mode", () => {
    render(<ChatHeader {...defaultProps} isFullScreen={true} />);

    expect(
      screen.getByRole("button", {
        name: /full screen/i,
      })
    ).toBeInTheDocument();
  });
});
