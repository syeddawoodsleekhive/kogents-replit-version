export const handleDownload = (attachment: Attachment) => {
  const link = document.createElement("a");
  link.href = attachment.url;
  link.download = attachment.fileName;
  link.style.display = "none";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const handleOpenInNewTab = (attachment: Attachment) => {
  if (attachment.url.startsWith("data:")) {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>${attachment.fileName}</title></head>
          <body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;">
            <img src="${attachment.url}" alt="${attachment.fileName}" style="max-width:100%;max-height:100%;object-fit:contain;" />
          </body>
        </html>
      `);
    }
  } else {
    window.open(attachment.url, "_blank", "noopener,noreferrer");
  }
};

export const formatFileSize = (attachment: Attachment) => {
  if (attachment.size !== undefined) {
    return formatBytes(attachment.size);
  }

  return "Size unknown";
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};
