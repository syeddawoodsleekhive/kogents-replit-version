"use client";

import { UserIcon } from "@/icons";
import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { visitorDetailType } from "@/types/visitor";
import ConversationTagManager from "@/components/tags/ConversationTagManager";
import { ArrowDown, Dot } from "lucide-react";
import { cleanURL } from "@/functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMemo } from "react";
import { getReferrerData } from "@/functions/index-v2";
import { BrowserIcon, CountryFlag, DeviceIcon } from "@/components/common";
import { useShortDuration } from "@/hooks/useShortDuration";

interface VisitorRightSideBarType {
  roomDetails: conversationSessionType;
  connected: boolean;
  visitorLeft: boolean;
  assignTagToChat: (roomId: string, tagId: string) => void;
  unassignTagFromChat: (roomId: string, tagId: string) => void;
}

const VisitorRightSideBar = ({
  roomDetails,
  connected = false,
  visitorLeft = false,
  assignTagToChat,
  unassignTagFromChat,
}: VisitorRightSideBarType) => {
  // const debouncedSendVisitorUpdate = useMemo(
  //   () =>
  //     debounce((data: visitorDetailType) => {
  //       const payload = {
  //         visitorInfo: data,
  //         sessionId: roomId,
  //       };
  //       socket.emit("AddVisitorDetailToSession", payload);
  //     }, 800),
  //   [roomId]
  // );

  const updateVisitorDetailField = <K extends keyof visitorDetailType>(
    key: K,
    value: visitorDetailType[K]
  ) => {
    // setVisitorDetail((prev) => {
    //   const updated = { ...prev, [key]: value };
    //   debouncedSendVisitorUpdate(updated);
    //   return updated;
    // });
  };

  const timeOnSite = useShortDuration(new Date(roomDetails?.createdAt || ""));

  const visitorStats = useMemo(() => {
    if (!roomDetails) return { pastVisits: 0, pastChats: 0 };

    const pastVisits = roomDetails.totalSessions || 0;
    const pastChats = roomDetails.totalChats || 0;

    return {
      pastVisits: pastVisits > 0 ? pastVisits - 1 : 0,
      pastChats,
    };
  }, [roomDetails]);

  if (!roomDetails) {
    return (
      <div className="w-[20rem] bg-gray-50 flex flex-col overflow-auto">
        <div className="p-4 text-center text-gray-500">
          <p>Loading visitor details...</p>
        </div>
      </div>
    );
  }

  const referrerData = useMemo(
    () => getReferrerData(roomDetails.visitorSessionDetails),
    [roomDetails.visitorSessionDetails]
  );

  return (
    <div className="w-[20rem] bg-gray-50 flex flex-col overflow-auto">
      <div className="p-4 space-y-4">
        {/* Avatar */}
        <div className="flex justify-center mb-2">
          <div
            className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center shadow-sm text-white"
            style={{ background: `#${roomDetails.visitorId.slice(0, 6)}` }}
          >
            <UserIcon />
          </div>
        </div>

        {/* Visitor Details Form */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Add name"
              className="bg-white"
              value={roomDetails.visitorDetails.name || ""}
              onChange={(e) => updateVisitorDetailField("name", e.target.value)}
              disabled={!connected || visitorLeft}
            />

            <Input
              placeholder="Add email"
              className="bg-white"
              value={roomDetails.visitorDetails.email || ""}
              onChange={(e) =>
                updateVisitorDetailField("email", e.target.value)
              }
              disabled={!connected || visitorLeft}
            />

            <Input
              placeholder="Add phone number"
              className="bg-white"
              value={roomDetails.visitorDetails.phone || ""}
              onChange={(e) =>
                updateVisitorDetailField("phone", e.target.value)
              }
              disabled={!connected || visitorLeft}
            />

            <Textarea
              placeholder="Add visitor notes"
              className="bg-white resize-none h-24"
              value={roomDetails.visitorDetails.note || ""}
              onChange={(e) => updateVisitorDetailField("note", e.target.value)}
              disabled={!connected || visitorLeft}
            />
          </CardContent>
        </Card>

        {/* Visitor Stats */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="px-1 py-1">
                <div className="text-lg font-semibold">
                  {visitorStats.pastVisits}
                </div>
                <div className="text-xs text-gray-500">Past visits</div>
              </div>
              <div className="px-1 py-1">
                <div className="text-lg font-semibold">
                  {visitorStats.pastChats}
                </div>
                <div className="text-xs text-gray-500">Past chats</div>
              </div>
              <div className="px-1 py-1">
                <div className="text-lg font-semibold">{timeOnSite}</div>
                <div className="text-xs text-gray-500">Time on site</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <ConversationTagManager
          conversationId={roomDetails.id || ""}
          connected={connected && !visitorLeft}
          assignTagToChat={assignTagToChat}
          unassignTagFromChat={unassignTagFromChat}
        />

        {/* Visitor Path */}
        {roomDetails.visitorSessionDetails?.visitorPageTracking && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Visitor Path
              </label>
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

                {roomDetails.visitorSessionDetails.visitorPageTracking.navigationPath.map(
                  (page, index) => (
                    <li
                      className="flex items-start bg-white text-xs"
                      key={index}
                    >
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
            </CardContent>
          </Card>
        )}

        {/* Visitor information section */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            {/* Location */}
            {roomDetails.visitorSessionDetails?.location && (
              <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Location
                </label>
                <div className="text-sm text-gray-600 flex items-center">
                  <CountryFlag
                    countryKey={
                      roomDetails.visitorSessionDetails.location?.countryKey
                    }
                  />
                  <span className="ml-1">
                    {roomDetails.visitorSessionDetails.location.city || "-"},{" "}
                    {roomDetails.visitorSessionDetails.location.region || "-"},{" "}
                    {roomDetails.visitorSessionDetails.location.country || "-"}
                  </span>
                </div>
              </div>
            )}

            {/* Browser */}
            {roomDetails.visitorSessionDetails?.deviceInfo && (
              <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Browser
                </label>
                <div className="text-sm text-gray-600 flex items-center">
                  <BrowserIcon visitor={roomDetails.visitorSessionDetails} />
                  <span className="ml-1">
                    {roomDetails.visitorSessionDetails.deviceInfo.browser ||
                      "Unknown"}
                  </span>
                </div>
              </div>
            )}

            {/* Platform */}
            {roomDetails.visitorSessionDetails?.deviceInfo && (
              <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Platform
                </label>
                <div className="text-sm text-gray-600">
                  <span className="ml-1">
                    {roomDetails.visitorSessionDetails.deviceInfo.platform ||
                      "Unknown"}
                  </span>
                </div>
              </div>
            )}

            {/* Device */}
            {roomDetails.visitorSessionDetails?.deviceInfo && (
              <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Device
                </label>
                <div className="text-sm text-gray-600 flex items-center">
                  <DeviceIcon visitor={roomDetails.visitorSessionDetails} />
                  <span className="ml-1">
                    {roomDetails.visitorSessionDetails.deviceInfo.device ||
                      "Unknown"}
                    {roomDetails.visitorSessionDetails.deviceInfo.deviceType
                      ? `, ${roomDetails.visitorSessionDetails.deviceInfo.deviceType}`
                      : ""}
                  </span>
                </div>
              </div>
            )}

            {/* IP Address */}
            {roomDetails.visitorSessionDetails?.ipAddress && (
              <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  IP address
                </label>
                <div className="text-sm text-gray-600">
                  {roomDetails.visitorSessionDetails.ipAddress}
                </div>
              </div>
            )}

            {/* Hostname */}
            {roomDetails.visitorSessionDetails?.hostName && (
              <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Hostname
                </label>
                <div className="text-sm text-gray-600">
                  {roomDetails.visitorSessionDetails.hostName}
                </div>
              </div>
            )}

            {/* User Agent */}
            {roomDetails.visitorSessionDetails?.userAgent && (
              <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  User agent
                </label>
                <div className="text-sm text-gray-600 break-words">
                  {roomDetails.visitorSessionDetails.userAgent}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisitorRightSideBar;
