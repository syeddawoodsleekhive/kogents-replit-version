import { TableCell, TableRow } from "@/components/ui/table";
import { cleanURL } from "@/functions";
import { Search } from "lucide-react";
import React, { memo, useMemo, useCallback } from "react";
import {
  AgentNames,
  BrowserIcon,
  CountryFlag,
  DeviceIcon,
  getIconConfig,
  VisitorTags,
} from "../common";
import { getReferrerData } from "@/functions/index-v2";
import { useShortDuration } from "@/hooks/useShortDuration";

interface VisitorRowProps {
  visitor: visitorSessionDataType;
  onClick: (roomId: string) => void;
  iconType?: "chat" | "eye" | "idle" | "incoming" | "away";
  showMessage?: boolean;
  showAgent?: boolean;
}

export const VisitorRow = memo(
  ({
    visitor,
    onClick,
    iconType = "idle",
    showMessage = false,
    showAgent = false,
  }: VisitorRowProps) => {
    const iconConfig = useMemo(() => getIconConfig(iconType), [iconType]);
    const referrerData = useMemo(() => getReferrerData(visitor), [visitor]);
    const showTag = useMemo(
      () => visitor.tags && visitor.tags.length > 0,
      [visitor.tags]
    );
    const visitorName = useMemo(
      () => visitor.name || `#${visitor.visitorId}`,
      [visitor.name, visitor.visitorId]
    );
    const connectedTime = useShortDuration(
      visitor.connectedAt ? new Date(visitor.connectedAt) : undefined
    );

    const handleClick = useCallback(() => {
      onClick(visitor.roomId);
    }, [onClick, visitor.roomId]);

    return (
      <>
        <TableRow
          className={`cursor-pointer text-xs text-gray-700 chat_tr ${
            showTag ? "border-b-0 pb-0" : ""
          }`}
          onClick={handleClick}
        >
          <TableCell className="py-1 font-medium max-w-[18.5rem]">
            <div className="flex items-center gap-2">
              <div
                className={`${iconConfig.bg} rounded-sm h-5 w-5 flex items-center justify-center`}
              >
                {iconConfig.icon}
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span title={visitorName} className="text-xs font-normal">
                    {visitorName}
                  </span>
                  <div className="flex ml-2 text-gray-400">
                    <CountryFlag countryKey={visitor.location?.countryKey} />
                    <DeviceIcon visitor={visitor} />
                    <BrowserIcon visitor={visitor} />
                  </div>
                </div>
              </div>
            </div>
          </TableCell>

          <TableCell className="w-[6.75rem]">
            <div className="flex items-center">{connectedTime}</div>
          </TableCell>

          {showAgent &&
          visitor.agentsInRoom &&
          visitor.agentsInRoom.length > 0 ? (
            <TableCell>
              {visitor.aiStatus === "ai-agent" &&
              visitor.agentsInRoom.length === 0 ? (
                "AI Agent"
              ) : (
                <AgentNames agents={visitor.agentsInRoom || []} />
              )}
            </TableCell>
          ) : null}

          {showMessage && <TableCell>{visitor.lastMessage?.content}</TableCell>}

          <TableCell className="max-w-[200px] truncate">
            {visitor.pageTracking.pageTitle}
          </TableCell>

          <TableCell>
            <div className="flex items-center">
              <Search className="h-4 w-4 mr-2 text-gray-400" />
              {referrerData && (
                <span
                  title={referrerData.referrerLink}
                  className="truncate block whitespace-nowrap overflow-hidden max-w-[15rem]"
                >
                  {referrerData.isDirect
                    ? referrerData.label
                    : cleanURL(referrerData.referrerLink)}
                </span>
              )}
            </div>
          </TableCell>

          <TableCell className="text-right">
            {visitor.totalVisits || 0}
          </TableCell>
          <TableCell className="text-right">
            {visitor.totalChats || 0}
          </TableCell>
        </TableRow>

        {showTag && (
          <TableRow className="border-t-0 cursor-pointer" onClick={handleClick}>
            <TableCell
              colSpan={iconType === "idle" ? 8 : 7}
              className="pt-0 pb-3"
            >
              <VisitorTags tags={visitor.tags} iconType={iconType} />
            </TableCell>
          </TableRow>
        )}
      </>
    );
  }
);

VisitorRow.displayName = "VisitorRow";
