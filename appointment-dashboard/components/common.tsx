import { formatTime } from "@/functions/index-v2";
import { getBrowserIcon, getDeviceIcon } from "@/icons";
import {
  Check,
  CheckCheck,
  CircleDot,
  Clock,
  Eye,
  MessageSquareMore,
} from "lucide-react";
import React, { memo, useCallback } from "react";

export const CountryFlag = memo(({ countryKey }: { countryKey?: string }) => {
  if (!countryKey) return null;

  return (
    <div className="flex items-center justify-center w-5 h-5">
      <img
        src={`https://flagcdn.com/16x12/${countryKey.toLowerCase()}.png`}
        alt={`${countryKey} flag`}
        className="w-4 h-3"
        loading="lazy"
      />
    </div>
  );
});

export const DeviceIcon = memo(
  ({ visitor }: { visitor?: Partial<visitorSessionDataType> }) => {
    if (!visitor?.deviceInfo?.device) return null;

    return (
      <div className="flex items-center justify-center w-5 h-5">
        {getDeviceIcon({ visitor })}
      </div>
    );
  }
);

// Memoized browser icon component
export const BrowserIcon = memo(
  ({ visitor }: { visitor?: Partial<visitorSessionDataType> }) => {
    if (!visitor?.deviceInfo?.browser) return null;

    return (
      <div className="flex items-center justify-center w-5 h-5">
        {getBrowserIcon({ visitor })}
      </div>
    );
  }
);

export const MessageStatusIcon = memo(({ msg }: { msg: MessageType }) => {
  if (!msg.createdAt && !msg.sentAt) {
    return <Clock className="h-3 w-3 text-gray-400" />;
  } else if (msg.deliveredAt || msg.readAt) {
    return (
      <CheckCheck
        className={`h-3 w-3 ${msg.readAt ? "text-blue-500" : "text-gray-400"}`}
      />
    );
  } else if (msg.createdAt || msg.sentAt) {
    return <Check className="h-3 w-3 text-gray-400" />;
  }
  return null;
});

export const SystemMessageUI = ({
  msg,
  createdAt,
  messageType,
  link,
}: {
  msg: string;
  createdAt?: string;
  messageType?: string;
  link?: string;
}) => {
  const handlePageClick = useCallback((url: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, []);

  return (
    <div className="flex items-center justify-center px-4 py-2 relative systemMessage">
      <div className="text-center">
        <p className="text-xs text-gray-500 italic font-light">
          {messageType === "page-tracking" ? (
            <span
              className="flex items-center justify-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => link && handlePageClick(link)}
              title={link ? `Click to open: ${link}` : undefined}
            >
              <Eye className="h-4 w-4 text-gray-400" />
              <span className="hover:underline">{msg}</span>
            </span>
          ) : (
            msg
          )}
        </p>
        {createdAt ? (
          <span className="absolute top-2 right-6 text-xs text-gray-400 font-light">
            {formatTime(createdAt)}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export const AgentNames = memo(({ agents }: { agents: AgentInRoomType[] }) => {
  if (!agents || agents.length === 0) return <span>-</span>;

  return (
    <div className="flex items-center gap-1 relative">
      <span>{agents[0].agentName}</span>
      {agents.length > 1 && (
        <div className="relative group">
          <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-primary text-xs text-white cursor-pointer">
            +{agents.length - 1}
          </span>
          <div className="fixed mt-0.5 z-10 hidden group-hover:block min-w-max bg-white border border-gray-200 rounded shadow-lg p-2">
            {agents.slice(1).map((a, idx) => (
              <div
                key={a.agentId || idx}
                className="text-[0.75rem] px-1.5 py-0.5 whitespace-nowrap rounded"
              >
                {a.agentName}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export const getIconConfig = (iconType: string) => {
  const configs = {
    chat: {
      bg: "bg-green-500 text-white",
      icon: <MessageSquareMore className="h-3.5 w-3.5" />,
    },
    eye: {
      bg: "bg-cyan-500 text-white",
      icon: <Eye className="h-3.5 w-3.5" />,
    },
    incoming: {
      bg: "bg-red-500 text-white",
      icon: <MessageSquareMore className="h-3.5 w-3.5" />,
    },
    default: {
      bg: "bg-gray-200 text-gray-600",
      icon: <CircleDot className="h-3.5 w-3.5" />,
    },
  };

  return configs[iconType as keyof typeof configs] || configs.default;
};

export const VisitorTags = memo(
  ({ tags, iconType }: { tags?: Tag[]; iconType: string }) => {
    if (!tags?.length) return null;

    return (
      <div className="flex items-center flex-wrap gap-1">
        {tags.map((tag, index) => (
          <React.Fragment key={index}>
            {iconType === "idle" && tag.name.toLowerCase() === "idle" ? null : (
              <span className="d-flex bg-gray-200 p-1 text-[0.6875rem] leading-[1.35] px-2 rounded-sm">
                {tag.name}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }
);
