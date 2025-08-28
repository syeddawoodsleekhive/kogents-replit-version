export const downloadTranscript = (chat: conversationSessionType | null) => {
  if (!chat) return;

  // Create transcript text
  const transcriptText = chat.messages
    .map((entry) => {
      const timestamp = new Date(entry.createdAt).toLocaleString();
      const sender = entry.senderType === "agent" ? "Agent" : "Visitor";
      return `[${timestamp}] ${sender}: ${entry.content}`;
    })
    .join("\n\n");

  // Create and download file
  const blob = new Blob([transcriptText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chat-transcript-${chat.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const handleViewLink = (chat: conversationSessionType | null) => {
  if (!chat) return;

  // In a real app, this would generate a shareable link
  // For now, we'll just show the chat ID
  const viewUrl = `${window.location.origin}/chat-logs/view/${chat.id}`;

  // Copy to clipboard
  navigator.clipboard
    .writeText(viewUrl)
    .then(() => {
      alert("View link copied to clipboard!");
    })
    .catch(() => {
      // Fallback for older browsers
      prompt("Copy this link:", viewUrl);
    });
};
