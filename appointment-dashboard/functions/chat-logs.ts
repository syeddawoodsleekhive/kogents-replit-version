export const handleViewLink = (selectedChat?: conversationSessionType) => {
  const newWindow = window.open("", "_blank");
  if (newWindow) {
    newWindow.document.write(`
                          <html>
                            <head>
                              <title>Chat Transcript - ${
                                selectedChat?.visitorDetails.name ||
                                selectedChat?.visitorId
                              }</title>
                              <style>
                                body {
                                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                  margin: 0;
                                  padding: 0;
                                  background-color: #f5f5f5;
                                  line-height: 1.6;
                                }
                                .container {
                                  width: 100%;
                                  max-width: none;
                                  margin: 0;
                                  background: white;
                                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                  min-height: 100vh;
                                }
                                .top-bar {
                                  height: 4px;
                                  background: #171717;
                                  width: 100%;
                                }
                                .content {
                                  padding: 40px;
                                  max-width: 1200px;
                                  margin: 0 auto;
                                }
                                .title {
                                  text-align: center;
                                  font-size: 24px;
                                  font-weight: 600;
                                  color: #333;
                                  margin-bottom: 30px;
                                }
                                .chat-start {
                                  text-align: center;
                                  color: #666;
                                  margin-bottom: 30px;
                                  font-size: 14px;
                                }
                                .transcript-content {
                                  margin-bottom: 40px;
                                }
                                .chat-message {
                                  margin-bottom: 20px;
                                  display: flex;
                                  align-items: flex-start;
                                  gap: 12px;
                                }
                                .chat-message.visitor {
                                  justify-content: end;
                                  flex-direction: row-reverse;
                                }
                                .chat-message.agent {
                                  justify-content: flex-start;
                                }
                                .chat-message.system {
                                  justify-content: center;
                                  margin: 20px 0;
                                }
                                .avatar {
                                  width: 40px;
                                  height: 40px;
                                  border-radius: 50%;
                                  background-color: #e5e7eb;
                                  display: flex;
                                  align-items: center;
                                  justify-content: center;
                                  flex-shrink: 0;
                                }
                                .avatar svg {
                                  width: 24px;
                                  height: 24px;
                                  color: #6b7280;
                                }
                                .message-bubble {
                                  max-width: 400px;
                                  padding: 12px 16px;
                                  border-radius: 8px;
                                  font-size: 14px;
                                  line-height: 1.5;
                                }
                                .message-bubble.agent {
                                  background-color: #e5e7eb;
                                  color: #111827;
                                }
                                .message-bubble.visitor {
                                  background-color: #171717;
                                  color: white;
                                }
                                .message-bubble.system {
                                  background-color: #f3f4f6;
                                  color: #6b7280;
                                  font-style: italic;
                                  text-align: center;
                                  padding: 8px 16px;
                                  border-radius: 20px;
                                }
                                .timestamp {
                                  font-size: 12px;
                                  color: #9ca3af;
                                  margin-top: 4px;
                                  text-align: left;
                                }
                                .timestamp.visitor {
                                  text-align: right;
                                }
                                .timestamp.system {
                                  text-align: center;
                                }
                                .visitor-info {
                                  background: #f8f9fa;
                                  padding: 20px;
                                  border-radius: 8px;
                                  margin-bottom: 30px;
                                }
                                .info-row {
                                  display: flex;
                                  margin-bottom: 8px;
                                }
                                .info-label {
                                  width: 120px;
                                  font-weight: 600;
                                  color: #333;
                                  font-size: 12px;
                                }
                                .info-value {
                                  flex: 1;
                                  color: #666;
                                  font-size: 12px;
                                  word-break: break-all;
                                }
                                .footer {
                                  text-align: center;
                                  color: #999;
                                  font-size: 12px;
                                  margin-top: 40px;
                                  padding-top: 20px;
                                  border-top: 1px solid #eee;
                                }
                              </style>
                            </head>
                            <body>
                              <div class="container">
                                <div class="top-bar"></div>
                                <div class="content">
                                  <h1 class="title">Chat Transcript with ${
                                    selectedChat?.visitorDetails.name ||
                                    selectedChat?.visitorId
                                  }</h1>

                                  <div class="chat-start">
                                    Chat started on ${(() => {
                                      try {
                                        const chatTime = new Date(
                                          selectedChat?.createdAt || ""
                                        );
                                        if (isNaN(chatTime.getTime())) {
                                          return "Unknown Date";
                                        }
                                        return chatTime.toLocaleDateString(
                                          "en-US",
                                          {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                          }
                                        );
                                      } catch (e) {
                                        return "Unknown Date";
                                      }
                                    })()}, ${(() => {
      try {
        const chatTime = new Date(selectedChat?.createdAt || "");
        if (isNaN(chatTime.getTime())) {
          return "Unknown Time";
        }
        return chatTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      } catch (e) {
        return "Unknown Time";
      }
    })()} (GMT+0)
                                  </div>

                                  <div class="transcript-content">
                                    ${selectedChat?.messages
                                      .map((entry: MessageType) => {
                                        let timeStr = "Unknown Time";
                                        try {
                                          const entryTime = new Date(
                                            entry.createdAt
                                          );
                                          if (!isNaN(entryTime.getTime())) {
                                            timeStr =
                                              entryTime.toLocaleTimeString(
                                                "en-US",
                                                {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                  hour12: true,
                                                }
                                              );
                                          }
                                        } catch (e) {
                                          timeStr = "Unknown Time";
                                        }

                                        if (
                                          entry.senderType === "agent-system" ||
                                          entry.senderType === "visitor-system"
                                        ) {
                                          return (
                                            '<div class="chat-message system"><div class="message-bubble system">*** ' +
                                            entry.content +
                                            ' ***</div><div class="timestamp system">' +
                                            timeStr +
                                            "</div></div>"
                                          );
                                        } else if (
                                          entry.senderType === "agent"
                                        ) {
                                          return (
                                            '<div class="chat-message agent"><div class="avatar"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg></div><div><div class="message-bubble agent">' +
                                            entry.content +
                                            '</div><div class="timestamp">' +
                                            timeStr +
                                            "</div></div></div>"
                                          );
                                        } else {
                                          return (
                                            '<div class="chat-message visitor"><div class="avatar"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div><div><div class="message-bubble visitor">' +
                                            entry.content +
                                            '</div><div class="timestamp visitor">' +
                                            timeStr +
                                            "</div></div></div>"
                                          );
                                        }
                                      })
                                      .join("")}
                                  </div>

                                  <div class="visitor-info">
                                    <div class="info-row">
                                      <div class="info-label">NAME</div>
                                      <div class="info-value">${
                                        selectedChat?.visitorDetails.name ||
                                        selectedChat?.visitorId
                                      }</div>
                                    </div>
                                    <div class="info-row">
                                      <div class="info-label">EMAIL</div>
                                      <div class="info-value">${
                                        selectedChat?.visitorDetails.email ||
                                        "—"
                                      }</div>
                                    </div>
                                    <div class="info-row">
                                      <div class="info-label">PHONE</div>
                                      <div class="info-value">${
                                        selectedChat?.visitorDetails.phone ||
                                        "—"
                                      }</div>
                                    </div>
                                    <div class="info-row">
                                      <div class="info-label">LOCATION</div>
                                      <div class="info-value">${
                                        selectedChat?.visitorSessionDetails
                                          .location.country || "—"
                                      }</div>
                                    </div>
                                    <div class="info-row">
                                      <div class="info-label">DEPARTMENT</div>
                                      <div class="info-value">${
                                        selectedChat?.department || "—"
                                      }</div>
                                    </div>
                                    <div class="info-row">
                                      <div class="info-label">SERVED BY</div>
                                      <div class="info-value">${
                                        selectedChat?.primaryAgent?.name || "—"
                                      }</div>
                                    </div>
                                  </div>

                                  <div class="footer">
                                    Are you using Autobotx Chat yet? Sign up free today
                                  </div>
                                </div>
                              </div>
                            </body>
                          </html>
                        `);
    newWindow.document.close();
  }
};

export const generateTranscriptText = (selectedChat: any) => {
  if (!selectedChat) return "";

  let formattedDate = "Unknown Date";
  let formattedTime = "Unknown Time";

  try {
    const chatStartTime = new Date(selectedChat.time);
    if (!isNaN(chatStartTime.getTime())) {
      formattedDate = chatStartTime.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      formattedTime = chatStartTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  } catch (e) {
    console.error("Error formatting chat start time:", e);
  }

  return `Chat Transcript with ${selectedChat.name}

Chat started on ${formattedDate}, ${formattedTime} (GMT+0)

${selectedChat.transcript
  .map((entry: any) => {
    let timeStr = "Unknown Time";
    try {
      const entryTime = new Date(entry.time);
      if (!isNaN(entryTime.getTime())) {
        timeStr = entryTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
      }
    } catch (e) {
      console.error("Error formatting entry time:", e);
    }

    if (entry.type === "system") {
      return `(${timeStr}) *** ${entry.message} ***`;
    } else if (entry.type === "agent") {
      return `(${timeStr}) ${selectedChat.agent}: ${entry.message}`;
    } else {
      return `(${timeStr}) ${selectedChat.name}: ${entry.message}`;
    }
  })
  .join("\n")}

NAME: ${selectedChat.name}
EMAIL: ${selectedChat.userInfo?.email || "—"}
PHONE: ${selectedChat.userInfo?.phone || "—"}
LOCATION: ${selectedChat.userInfo?.location || "—"}
URL: ${selectedChat.userInfo?.visitorPath?.[0]?.source || "—"}
DEPARTMENT: ${selectedChat.department || "—"}
SERVED BY: ${selectedChat.agent}

Are you using Autobotx Chat yet? Sign up free today`;
};

export const downloadTranscript = (selectedChat: any) => {
  const transcriptText = generateTranscriptText(selectedChat);
  const blob = new Blob([transcriptText], {
    type: "text/plain",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chat-${selectedChat?.id || "transcript"}-${
    new Date().toISOString().split("T")[0]
  }.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
