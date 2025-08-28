import { renderHook, act } from "@testing-library/react";
import { useChatState } from "@/hooks/use-chat-state";
import { Message } from "@/types/chat";

describe("useChatState", () => {
  const defaultProps = {
    apiToken: "abcd",
    sessionId: "abcd",
  };

  it("initializes with empty messages", () => {
    const { result } = renderHook(() => useChatState(defaultProps));

    expect(result.current.messages).toEqual([]);
  });

  it("adds messages correctly", () => {
    const { result } = renderHook(() => useChatState(defaultProps));

    const newMessage: Message = {
      id: "1",
      content: "Hello",
      sender: "user" as const,
      timestamp: new Date(),
    };

    act(() => {
      result.current.addUserMessage(newMessage.content);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toEqual(newMessage.content);
  });

  it("clears messages", () => {
    const { result } = renderHook(() => useChatState(defaultProps));

    const newMessage = {
      id: "1",
      content: "Hello",
      sender: "user" as const,
      timestamp: new Date(),
    };

    act(() => {
      result.current.addUserMessage(newMessage.content);
    });

    expect(result.current.messages).toHaveLength(1);

    act(() => {
      result.current.clearChatHistory();
    });

    expect(result.current.messages).toHaveLength(0);
  });
});
