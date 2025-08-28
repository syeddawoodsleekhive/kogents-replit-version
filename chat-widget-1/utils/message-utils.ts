import type { Message } from "@/types/chat";

// Format chat transcript for download
export function formatChatTranscript(messages: any[]): string {
  try {
    const header = `Chat Transcript - ${new Date().toLocaleDateString()}\n\n`;
    const transcript = messages
      .map(({ timestamp, sender, content = "", attachment }) => {
        const time = new Date(timestamp).toLocaleString();
        const senderLabel = sender === "agent" ? "Support Agent" : "You";
        let line = `[${time}] ${senderLabel}: ${content}`;
        if (attachment) {
          line += `${content ? "\n" : ""}[File Attachment: ${attachment.name}]`;
        }
        return line;
      })
      .join("\n\n");
    return header + transcript;
  } catch (err) {
    console.error("Error formatting chat transcript:", err);
    return "Chat transcript could not be generated.";
  }
}

// Download chat transcript
export function downloadTranscript(messages: any[]): void {
  try {
    if (!messages.length || !document.body || !document.body.appendChild)
      return;
    const fullTranscript = formatChatTranscript(messages);
    const blob = new Blob([fullTranscript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-transcript-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error downloading chat transcript:", err);
  }
}
