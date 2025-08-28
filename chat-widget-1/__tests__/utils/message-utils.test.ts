import {
  formatChatTranscript,
  downloadTranscript,
} from "../../utils/message-utils";

describe("message-utils", () => {
  const baseMessage = {
    timestamp: Date.now(),
    sender: "user",
    content: "Hello!",
    attachment: undefined,
  };

  it("formats chat transcript with messages", () => {
    const messages = [
      { ...baseMessage },
      {
        ...baseMessage,
        sender: "agent",
        content: "Hi!",
        timestamp: Date.now() + 1000,
      },
    ];
    const result = formatChatTranscript(messages);
    expect(result).toContain("Support Agent");
    expect(result).toContain("You");
    expect(result).toContain("Hello!");
    expect(result).toContain("Hi!");
  });

  it("formats chat transcript with attachments", () => {
    const messages = [{ ...baseMessage, attachment: { name: "file.txt" } }];
    const result = formatChatTranscript(messages);
    expect(result).toContain("File Attachment: file.txt");
  });

  it("returns header with date", () => {
    const messages = [baseMessage];
    const result = formatChatTranscript(messages);
    expect(result).toMatch(/Chat Transcript - .+\n/);
  });

  it("downloadTranscript does nothing with empty messages", () => {
    // Should not throw
    expect(() => downloadTranscript([])).not.toThrow();
  });
});
