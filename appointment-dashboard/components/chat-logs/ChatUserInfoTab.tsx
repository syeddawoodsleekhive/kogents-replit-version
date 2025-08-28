import {
  User,
  Globe,
  Monitor,
  Smartphone,
  Server,
  ArrowDown,
  Dot,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMemo } from "react";
import { getReferrerData } from "@/functions/index-v2";
import { cleanURL } from "@/functions";
import { BrowserIcon, CountryFlag, DeviceIcon } from "../common";

interface ChatUserInfoTabProps {
  selectedChat: conversationSessionType | null;
  onUserInfoChange: (field: string, value: string) => void;
}

const ChatUserInfoTab = ({
  selectedChat,
  onUserInfoChange,
}: ChatUserInfoTabProps) => {
  const referrerData = useMemo(
    () => getReferrerData(selectedChat?.visitorSessionDetails),
    [selectedChat?.visitorSessionDetails]
  );
  return (
    <div className="space-y-6">
      {/* Basic User Details */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-orange-600" />
          </div>
          <div className="space-y-3 flex-1">
            <Input
              placeholder="Add name"
              className="w-full"
              value={selectedChat?.visitorDetails?.name || ""}
              onChange={(e) => onUserInfoChange("name", e.target.value)}
            />
            <Input
              placeholder="Add email"
              className="w-full"
              value={selectedChat?.visitorDetails?.email || ""}
              onChange={(e) => onUserInfoChange("email", e.target.value)}
            />
            <Input
              placeholder="Add phone number"
              className="w-full"
              value={selectedChat?.visitorDetails?.phone || ""}
              onChange={(e) => onUserInfoChange("phone", e.target.value)}
            />
            <textarea
              placeholder="Add visitor notes"
              className="w-full h-24 border border-gray-300 rounded-md p-3 text-sm resize-none"
              value={selectedChat?.visitorDetails?.note || ""}
              onChange={(e) => onUserInfoChange("notes", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="flex gap-6">
        <div className="text-center p-4 bg-white border border-gray-200 rounded-lg flex-1">
          <div className="text-2xl font-bold text-gray-900">
            {selectedChat?.totalSessions || 0}
          </div>
          <div className="text-sm text-gray-500">Past visits</div>
        </div>
        <div className="text-center p-4 bg-white border border-gray-200 rounded-lg flex-1">
          <div className="text-2xl font-bold text-gray-900">
            {selectedChat?.totalChats || 0}
          </div>
          <div className="text-sm text-gray-500">Past chats</div>
        </div>
      </div>

      {/* Visitor Path */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 text-lg mb-3">Visitor Path</h4>

        <ul className="space-y-2">
          {referrerData && (
            <li className="flex items-start bg-white text-xs">
              <span className="flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-gray-600 text-[0.625rem] font-medium mr-2">
                <ArrowDown strokeWidth={4} className="h-3" />
              </span>
              <a
                href={referrerData.referrerLink}
                target="_blank"
                className="text-gray-600 hover:underline truncate block truncate whitespace-nowrap overflow-hidden"
                title={referrerData.referrerLink}
                rel="noreferrer"
              >
                {referrerData.isDirect
                  ? referrerData.label
                  : cleanURL(referrerData.referrerLink)}
              </a>
            </li>
          )}

          {selectedChat?.visitorSessionDetails.visitorPageTracking.navigationPath.map(
            (page, index) => (
              <li className="flex items-start bg-white text-xs" key={index}>
                <span className="flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-gray-600 text-[0.625rem] font-medium mr-2">
                  <Dot strokeWidth={5} />
                </span>
                <a
                  href={page.pageUrl}
                  target="_blank"
                  className="text-gray-600 hover:underline truncate block truncate whitespace-nowrap overflow-hidden"
                  title={page.pageUrl}
                  rel="noreferrer"
                >
                  {page.pageTitle}
                </a>
              </li>
            )
          )}
        </ul>
      </div>

      {/* Caller Information */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 text-lg mb-3">
          Caller Information
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-nowrap">Name:</span>
            <span className="text-gray-900 text-end">
              {selectedChat?.visitorDetails?.name ||
                `#${selectedChat?.visitorId}` ||
                "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-nowrap">Email:</span>
            <span className="text-gray-900 text-end">
              {selectedChat?.visitorDetails?.email || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-nowrap">Phone:</span>
            <span className="text-gray-900 text-end">
              {selectedChat?.visitorDetails?.phone || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-nowrap">Customer ID:</span>
            <span className="text-gray-900 text-end">
              {selectedChat?.visitorId || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-nowrap">Session ID:</span>
            <span className="text-gray-900 text-end">
              {selectedChat?.visitorSessionId}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-nowrap">Country:</span>
            <span className="text-gray-900 text-end">
              {selectedChat?.visitorSessionDetails.location.country || "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 text-lg mb-3">
          Technical Details
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-gray-400 w-5 text-center">
              {selectedChat?.visitorSessionDetails.location?.countryKey ? (
                <CountryFlag
                  countryKey={
                    selectedChat?.visitorSessionDetails.location?.countryKey
                  }
                />
              ) : (
                <Globe className="w-4 h-4 text-gray-400" />
              )}
            </span>
            <span className="text-gray-600">
              {selectedChat?.visitorSessionDetails.location.city || "-"},{" "}
              {selectedChat?.visitorSessionDetails.location.region || "-"},{" "}
              {selectedChat?.visitorSessionDetails.location.country || "-"}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400 w-5 text-center">
              <BrowserIcon visitor={selectedChat?.visitorSessionDetails} />
            </span>
            <span className="text-gray-600">
              Browser:{" "}
              {selectedChat?.visitorSessionDetails.deviceInfo.browser ||
                "Unknown"}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400 w-5 text-center">
              <DeviceIcon visitor={selectedChat?.visitorSessionDetails} />
            </span>
            <span className="text-gray-600">
              Platform:{" "}
              {selectedChat?.visitorSessionDetails.deviceInfo.platform ||
                "Unknown"}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400 w-5 text-center">
              <DeviceIcon visitor={selectedChat?.visitorSessionDetails} />
            </span>
            <span className="text-gray-600">
              Device:{" "}
              {selectedChat?.visitorSessionDetails.deviceInfo.device ||
                "Unknown"}
              {selectedChat?.visitorSessionDetails.deviceInfo.deviceType
                ? `, ${selectedChat?.visitorSessionDetails.deviceInfo.deviceType}`
                : ""}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400 w-5 text-center">
              <Server className="w-4 h-4 text-gray-400" />
            </span>
            <span className="text-gray-600">
              IP address:{" "}
              {selectedChat?.visitorSessionDetails.ipAddress || "Unknown"}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-400 w-5 min-w-5">
              <Server className="w-4 h-4 text-gray-400" />
            </span>
            <span className="text-gray-600">
              User agent:{" "}
              {selectedChat?.visitorSessionDetails.userAgent || "Unknown"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatUserInfoTab;
