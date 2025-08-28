"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowDown,
  Dot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SearchFilterSystem,
  type FilterValue,
} from "@/components/search-filter-system";
import { DataExportDialog } from "@/components/data-export-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import ChatLogItem from "./chat-log-item";
import { Visitor } from "@/types/visitor";
import {
  cleanURL,
  getShortDuration,
  splitChatsByVisitorLeft,
} from "@/functions";
import { useUser } from "@/context/UserContext";
import { Skeleton } from "./ui/skeleton";
import ConversationHistory from "./visitor/conversation-history";
import Axios from "@/lib/axios";

export function ChatLogViewer() {
  const { workspace } = useUser();

  const workspaceId = workspace?._id;
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");

  const [allConversations, setAllConversations] = useState<Visitor[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    Visitor | undefined
  >(undefined);
  const [filteredConversations, setFilteredConversations] = useState<Visitor[]>(
    []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  const sessionId = searchParams.get("conversation");

  useEffect(() => {
    if (sessionId) {
      const convo = allConversations.find((c) => c.id === sessionId);
      setSelectedConversation(convo);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!workspaceId) return;

    Axios.get(
      `/visitor-session/pagination/${workspaceId}?active=false&page=1&limit=500`
    )
      .then((res) => {
        if (res.data) {
          const tempData = res.data.data.map((c: any) => ({ ...c, id: c._id }));
          setAllConversations(tempData);
          setFilteredConversations(tempData);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [workspaceId]);

  // Handle filter changes
  const handleFilterChange = (filters: FilterValue) => {
    setSearchQuery(filters.search || "");
    const filtered = allConversations.filter((conversation) => {
      // Search filter
      const searchMatch =
        !filters.search ||
        conversation.name
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        (conversation.visitorInfo?.name &&
          conversation.visitorInfo?.name
            .toLowerCase()
            .includes(filters.search.toLowerCase())) ||
        (conversation.visitorInfo?.email &&
          conversation.visitorInfo?.email
            .toLowerCase()
            .includes(filters.search.toLowerCase())) ||
        conversation.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        (conversation.visitorInfo?.phone &&
          conversation.visitorInfo?.phone.includes(filters.search)) ||
        (Array.isArray(conversation.chats) &&
          conversation.chats.some(
            (chat) =>
              typeof chat.content === "string" &&
              chat.content.toLowerCase().includes(filters.search.toLowerCase())
          )) ||
        (Array.isArray(conversation.chats) &&
          conversation.chats.some(
            (chat) =>
              typeof chat.name === "string" &&
              chat.name.toLowerCase().includes(filters.search.toLowerCase())
          ));

      // Date range filter
      let dateMatch = true;
      if (filters.dateRange.from || filters.dateRange.to) {
        const conversationDate = new Date(conversation.createdAt);

        if (filters.dateRange.from && filters.dateRange.to) {
          dateMatch =
            conversationDate >= filters.dateRange.from &&
            conversationDate <= filters.dateRange.to;
        } else if (filters.dateRange.from) {
          dateMatch = conversationDate >= filters.dateRange.from;
        } else if (filters.dateRange.to) {
          dateMatch = conversationDate <= filters.dateRange.to;
        }
      }

      // Source filter
      const sourceMatch =
        filters.source.length === 0 || filters.source.includes("chatbot");

      return searchMatch && dateMatch && sourceMatch;
    });

    setFilteredConversations(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle export
  const handleExport = (format: any, options: any) => {
    console.log("Exporting chat logs:", format, options);
    // In a real application, this would call an API to export the data
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, "MMM d, yyyy h:mm a");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredConversations.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredConversations.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const totalTurns = selectedConversation?.chats?.filter(
    (t) => t.sender !== "system"
  ).length;

  const userTurns = selectedConversation?.chats?.filter(
    (t) => t.sender === "user"
  ).length;

  const agentTurns = selectedConversation?.chats?.filter(
    (t) => t.sender === "agent"
  ).length;

  const liveAgentTurns = selectedConversation?.chats?.filter(
    (t) => t.sender === "live-agent"
  ).length;

  return (
    <div className="space-y-4">
      {!selectedConversation ? (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="w-full sm:w-auto">
              <SearchFilterSystem
                onFilterChange={handleFilterChange}
                initialFilters={{
                  search: "",
                  status: [],
                  dateRange: { from: null, to: null },
                  source: [],
                }}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <DataExportDialog
                dataType="chats"
                count={filteredConversations.length}
                onExport={handleExport}
              />
            </div>
          </div>

          <div className="rounded-md border">
            {isLoading ? (
              <div className="divide-y">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-2 p-4">
                    <div className="flex items-center justify-between space-x-2 mb-4">
                      <div className="flex items-center space-x-2 w-full">
                        <Skeleton className="h-5 rounded-md w-1/6" />
                        <Skeleton className="h-5 rounded-md w-1/6" />
                      </div>
                      <Skeleton className="h-5 rounded-md w-1/5" />
                    </div>
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-5 w-2/5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 divide-y">
                {currentItems.length > 0 ? (
                  currentItems.map((conversation, index) => (
                    <ChatLogItem
                      key={index}
                      conversation={conversation}
                      onClick={() => setSelectedConversation(conversation)}
                      searchQuery={searchQuery}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No conversations found matching your filters.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pagination Section */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{currentItems.length}</strong> of{" "}
              <strong>{filteredConversations.length}</strong> conversations
              {filteredConversations.length !== allConversations.length && (
                <span> (filtered from {allConversations.length} total)</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {(() => {
                const pageButtons = [];
                const maxVisibleButtons = 5;
                let startPage = Math.max(
                  1,
                  currentPage - Math.floor(maxVisibleButtons / 2)
                );
                let endPage = Math.min(
                  totalPages,
                  startPage + maxVisibleButtons - 1
                );

                if (endPage - startPage < maxVisibleButtons - 1) {
                  startPage = Math.max(1, endPage - maxVisibleButtons + 1);
                }

                if (startPage > 2) {
                  pageButtons.push(
                    <Button
                      key={1}
                      variant={currentPage === 1 ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => paginate(1)}
                    >
                      1
                    </Button>
                  );
                  pageButtons.push(
                    <span key="start-ellipsis" className="px-2">
                      ...
                    </span>
                  );
                } else if (startPage === 2) {
                  pageButtons.push(
                    <Button
                      key={1}
                      variant={currentPage === 1 ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => paginate(1)}
                    >
                      1
                    </Button>
                  );
                }

                for (let i = startPage; i <= endPage; i++) {
                  pageButtons.push(
                    <Button
                      key={i}
                      variant={currentPage === i ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => paginate(i)}
                    >
                      {i}
                    </Button>
                  );
                }

                if (endPage < totalPages - 1) {
                  pageButtons.push(
                    <span key="end-ellipsis" className="px-2">
                      ...
                    </span>
                  );
                  pageButtons.push(
                    <Button
                      key={totalPages}
                      variant={
                        currentPage === totalPages ? "default" : "outline"
                      }
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => paginate(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  );
                } else if (endPage === totalPages - 1) {
                  pageButtons.push(
                    <Button
                      key={totalPages}
                      variant={
                        currentPage === totalPages ? "default" : "outline"
                      }
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => paginate(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  );
                }

                return pageButtons;
              })()}
              <Button
                variant="outline"
                size="icon"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedConversation(undefined);
                // handleFilterChange({
                //   search: "",
                //   status: [],
                //   dateRange: { from: null, to: null },
                //   source: [],
                // });
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to all conversations
            </Button>
            {/* <div className="flex gap-2">
              <DataExportDialog
                dataType="chats"
                count={1}
                onExport={handleExport}
                trigger={
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                }
              />
            </div> */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Caller Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="text-sm font-medium">
                      {selectedConversation?.visitorInfo?.name ||
                        selectedConversation.name}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                      Email:
                    </span>
                    <span className="text-sm">
                      {selectedConversation?.visitorInfo?.email || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                      Phone:
                    </span>
                    <span className="text-sm">
                      {selectedConversation?.visitorInfo?.phone || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                      Customer ID:
                    </span>
                    <span className="text-sm">{selectedConversation.name}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-sm text-muted-foreground text-nowrap">
                      Session ID:
                    </span>
                    <span
                      className="text-sm truncate text-right"
                      title={selectedConversation.id}
                    >
                      {selectedConversation.id}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-sm text-muted-foreground text-nowrap">
                      Country:
                    </span>
                    <span className="text-sm truncate text-right">
                      {selectedConversation?.location?.city || "-"},{" "}
                      {selectedConversation?.location?.state || "-"},{" "}
                      {selectedConversation?.location?.country || "-"}
                    </span>
                  </div>
                  {(() => {
                    const allchats = formatChats(
                      selectedConversation?.chats || []
                    );
                    const splitMsgs = splitChatsByVisitorLeft(allchats);
                    const userChatSegmentsCount = splitMsgs.filter((segment) =>
                      segment.some((msg) => msg.sender === "user")
                    ).length;
                    return (
                      <>
                        <div className="flex justify-between gap-2">
                          <span className="text-sm text-muted-foreground text-nowrap">
                            Visits:
                          </span>
                          <span
                            className="text-sm truncate text-right"
                            title={selectedConversation.id}
                          >
                            {splitMsgs.length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-sm text-muted-foreground text-nowrap">
                            Visits:
                          </span>
                          <span
                            className="text-sm truncate text-right"
                            title={selectedConversation.id}
                          >
                            {userChatSegmentsCount || 0}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {selectedConversation?.visitorPath ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Visitor Path</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(() => {
                      const referrer = selectedConversation?.referrer;
                      const trafficSource = referrer?.trafficSource;
                      const isDirect =
                        trafficSource?.type === "direct" &&
                        !trafficSource?.source;

                      const withoutGclid =
                        referrer?.referrer?.referrer ||
                        referrer?.referrer?.currentUrl ||
                        referrer?.referrer?.landingPage;

                      const label = isDirect
                        ? "Direct Traffic"
                        : trafficSource?.source || "Unknown Source";

                      const referrerLink =
                        referrer?.referrer?.referrer?.includes("gclid")
                          ? referrer?.referrer?.referrer
                          : referrer?.referrer?.currentUrl?.includes("gclid")
                          ? referrer?.referrer?.currentUrl
                          : referrer?.referrer?.landingPage?.includes("gclid")
                          ? referrer?.referrer?.landingPage
                          : withoutGclid || "";

                      if (!referrer) return null;

                      return (
                        <li className="flex items-start bg-white text-xs">
                          <span className="flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-gray-600 text-[0.625rem] font-medium mr-2">
                            <ArrowDown strokeWidth={4} className="h-3" />
                          </span>
                          {referrerLink ? (
                            <a
                              href={referrerLink}
                              title={referrerLink}
                              className="text-gray-600 truncate block whitespace-nowrap overflow-hidden hover:underline"
                            >
                              {isDirect ? label : cleanURL(referrerLink)}
                            </a>
                          ) : (
                            <span className="text-gray-600 truncate block whitespace-nowrap overflow-hidden">
                              {isDirect ? label : cleanURL(referrerLink)}
                            </span>
                          )}
                        </li>
                      );
                    })()}
                    {selectedConversation?.visitorPath?.map((p, index) => (
                      <li
                        className="flex items-start bg-white text-xs"
                        key={index}
                      >
                        <span className="flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-gray-600 text-[0.625rem] font-medium mr-2">
                          <Dot strokeWidth={5} />
                        </span>
                        <a
                          href={p.link}
                          target="_blank"
                          className="text-gray-600 hover:underline truncate block truncate whitespace-nowrap overflow-hidden"
                          title={p.link}
                          rel="noreferrer"
                        >
                          {p.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {/* <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Appointment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status:
                    </span>
                    <Badge variant="outline">
                      {selectedConversation?.appointment?.scheduled
                        ? "Scheduled"
                        : "Not Scheduled"}
                    </Badge>
                  </div>
                  {selectedConversation?.appointment?.scheduled && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Date & Time:
                        </span>
                        <span className="text-sm">
                          {formatTimestamp(
                            selectedConversation?.appointment?.datetime
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Duration:
                        </span>
                        <span className="text-sm">
                          {getShortDuration(
                            selectedConversation.createdAt,
                            selectedConversation.updatedAt
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Timezone:
                        </span>
                        <span className="text-sm">
                          {selectedConversation?.appointment?.timezone}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card> */}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Conversation Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Turns:
                    </span>
                    <span className="text-sm font-medium">{totalTurns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      User Turns:
                    </span>
                    <span className="text-sm">{userTurns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      AI Agent Turns:
                    </span>
                    <span className="text-sm">{agentTurns}</span>
                  </div>
                  {liveAgentTurns ? (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Live Agent Turns:
                      </span>
                      <span className="text-sm">{liveAgentTurns}</span>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Duration:
                    </span>
                    <span className="text-sm">
                      {getShortDuration(
                        selectedConversation.createdAt,
                        selectedConversation.updatedAt
                      )}
                      {/* {
                        selectedConversation?.conversation_metrics
                          ?.duration_seconds
                      }{" "}
                      seconds */}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      User Affirmations:
                    </span>
                    <span className="text-sm">
                      {
                        selectedConversation?.conversation_metrics
                          ?.user_affirmations
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Interruptions:
                    </span>
                    <span className="text-sm">
                      {
                        selectedConversation?.conversation_metrics
                          ?.interruptions
                      }
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Booking Successful:
                    </span>
                    <Badge variant="outline">
                      {selectedConversation?.conversation_metrics
                        ?.booking_successful
                        ? "Yes"
                        : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Disengagement:
                    </span>
                    <Badge variant="outline">
                      {selectedConversation?.conversation_metrics?.disengagement
                        ? "Yes"
                        : "No"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Engagement Score:
                      </span>
                      <span className="text-sm font-medium">
                        {selectedConversation?.call_outcome?.engagement_score
                          ? Math.round(
                              selectedConversation?.call_outcome
                                ?.engagement_score * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Call Outcome</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Lead Status:
                  </span>
                  <Badge variant="outline">
                    {selectedConversation?.call_outcome?.lead_status || "NA"}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Summary:
                  </span>
                  <p className="text-sm mt-1">
                    {selectedConversation?.call_outcome?.summary ||
                      "No summary yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <ConversationHistory
            conversation={selectedConversation}
            isClose={false}
            isDownload={false}
            title="Conversation History"
            onClose={() => null}
          />
        </div>
      )}
    </div>
  );
}
