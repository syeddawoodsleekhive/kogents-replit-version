import { Loader2, Paperclip, Wifi, WifiOff } from "lucide-react";

type useChatHookType = {
  visitor: any;
  wsStatus: any;
};

const useChatHook = ({ visitor, wsStatus }: useChatHookType) => {
  const formatTime = (date: Date) => {
    try {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("formatTime error:", error);
      return "--:--";
    }
  };

  const fileIcons = {
    pdf: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 text-red-500"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
    ),
    word: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 text-blue-700"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
    ),
    excel: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 text-green-600"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
    ),
    default: <Paperclip className="h-4 w-4 text-gray-500" />,
  };

  const getFileIcon = (fileType: string) => {
    try {
      if (fileType.startsWith("image/")) return null;
      if (fileType.includes("pdf")) return fileIcons.pdf;
      if (fileType.includes("word") || fileType.includes("doc"))
        return fileIcons.word;
      if (
        fileType.includes("sheet") ||
        fileType.includes("excel") ||
        fileType.includes("csv")
      )
        return fileIcons.excel;
      return fileIcons.default;
    } catch (error) {
      console.error("getFileIcon error:", error);
      return fileIcons.default;
    }
  };

  const getCountryFlag = (className = "h-3") => {
    try {
      return visitor?.location?.countryKey ? (
        <img
          src={`https://flagcdn.com/16x12/${visitor.location.countryKey.toLowerCase()}.png`}
          alt={`${visitor?.country} flag`}
          className={className}
        />
      ) : null;
    } catch (error) {
      console.error("getCountryFlag error:", error);
      return null;
    }
  };

  const getConnectionStatusIcon = () => {
    try {
      switch (wsStatus) {
        case "connecting":
          return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
        case "connected":
          return <Wifi className="h-4 w-4 text-green-500" />;
        case "disconnected":
        case "error":
          return <WifiOff className="h-4 w-4 text-red-500" />;
        default:
          return <WifiOff className="h-4 w-4 text-gray-500" />;
      }
    } catch (error) {
      console.error("getConnectionStatusIcon error:", error);
      return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  return {
    formatTime,
    getFileIcon,
    getCountryFlag,
    getConnectionStatusIcon,
  };
};

export default useChatHook;
