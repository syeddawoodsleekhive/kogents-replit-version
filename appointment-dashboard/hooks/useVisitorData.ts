import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Visitor } from "@/types/visitor";
import { toast } from "sonner";
import { socket } from "@/lib/socket";
import { useUser } from "@/context/UserContext";

export const useVisitorData = () => {
  const { workspace } = useUser();
  const workspaceId = workspace?._id;

  const [allVisitorsData, setAllVisitorsData] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingActive, setPendingActive] = useState<Set<string>>(new Set());

  // Use refs to track cleanup and prevent memory leaks
  const isMountedRef = useRef(true);
  const socketListenersRef = useRef<Set<string>>(new Set());
  const timeoutRefsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  // Cleanup function to clear all timeouts and socket listeners
  const cleanup = useCallback(() => {
    // Clear all timeouts
    timeoutRefsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    timeoutRefsRef.current.clear();

    // Remove all socket listeners
    socketListenersRef.current.forEach((listenerKey) => {
      try {
        socket.off(listenerKey);
      } catch (error) {
        console.error(`Error removing socket listener ${listenerKey}:`, error);
      }
    });
    socketListenersRef.current.clear();
  }, []);

  // Handle pending active visitors with proper cleanup
  useEffect(() => {
    if (!isMountedRef.current) return;

    allVisitorsData.forEach((v) => {
      if (
        (!v.agent || v.agent.length === 0) &&
        !v.chats?.some(
          (msg) =>
            msg.sender === "system" &&
            msg.content.includes("left the chat.") &&
            msg.status !== "hidden"
        )
      ) {
        // If not already pending, add to pendingActive and set a timeout
        if (!pendingActive.has(v.id)) {
          setPendingActive((prev) => new Set(prev).add(v.id));
          
          const timeout = setTimeout(() => {
            if (isMountedRef.current) {
              setPendingActive((prev) => {
                const next = new Set(prev);
                next.delete(v.id);
                return next;
              });
            }
          }, 1500);

          timeoutRefsRef.current.add(timeout);
        }
      }
    });
  }, [allVisitorsData, pendingActive]);

  // Main socket connection and data handling
  useEffect(() => {
    if (!workspaceId) {
      setAllVisitorsData([]);
      setLoading(false);
      return;
    }

    isMountedRef.current = true;
    const workspaceListenerKey = `workspace:${workspaceId}`;

    const handleVisitors = (response: any) => {
      if (!isMountedRef.current) return;

      try {
        if (response?.data) {
          const processedData = response.data.map((d: any) => {
            const systemMessage = {
              content: "Visitor has joined the chat.",
              sender: "system",
              status: "sent",
              timestamp: d.chats[0]?.timestamp || new Date(),
              type: "status",
            };

            const mergedChats = [systemMessage, ...d.chats];

            const filteredChats = mergedChats.filter((chat, index, arr) => {
              if (
                index > 0 &&
                chat.sender === "system" &&
                chat.content === arr[index - 1].content &&
                arr[index - 1].sender === "system"
              ) {
                return false;
              }
              return true;
            });

            return {
              ...d,
              id: d._id,
              chats: filteredChats,
            };
          });

          setAllVisitorsData(processedData);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error handling workspace visitors:", error);
        setLoading(false);
      }
    };

    try {
      // Add listener to tracking set
      socketListenersRef.current.add(workspaceListenerKey);
      socket.on(workspaceListenerKey, handleVisitors);
    } catch (error) {
      console.error("Socket on workspace error:", error);
    }

    try {
      socket.emit("FindWorkspace", { workspaceId, active: true });
    } catch (error) {
      console.error("Socket emit FindWorkspace error:", error);
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      
      try {
        socket.off(workspaceListenerKey);
        socketListenersRef.current.delete(workspaceListenerKey);
      } catch (error) {
        console.error("Socket off workspace error:", error);
      }
    };
  }, [workspaceId]);

  // Memoized helper function for getting latest indices
  const getLatestIndices = useCallback((visitor: Visitor) => {
    let latestAgentLeftIdx = -1;
    let latestUserMsgIdx = -1;

    visitor.chats?.forEach((msg, idx) => {
      if (
        msg.sender === "system" &&
        msg.content.includes("left the chat.") &&
        msg.status !== "hidden"
      ) {
        latestAgentLeftIdx = idx;
      }
      if (msg.sender === "user") {
        latestUserMsgIdx = idx;
      }
    });

    return { latestAgentLeftIdx, latestUserMsgIdx };
  }, []);

  // Memoized visitor filters for better performance
  const currentlyServedVisitors = useMemo(
    () =>
      allVisitorsData.filter(
        (v) =>
          (v.status === "live-agent" || (v.agent && v.agent.length)) &&
          !(v.status === "away")
      ),
    [allVisitorsData]
  );

  const leftVisitors = useMemo(
    () =>
      allVisitorsData.filter((v) => v.status === "away" || v.status === "left"),
    [allVisitorsData]
  );

  const leftVisitorIds = useMemo(
    () => new Set(leftVisitors.map((v) => v.id)),
    [leftVisitors]
  );

  const incomingMessages = useMemo(
    () =>
      allVisitorsData.filter((v) => {
        if (leftVisitorIds.has(v.id)) return false;
        // If there is an agent, not incoming
        if (Array.isArray(v.agent) && v.agent.length > 0) return false;
        if (v.status === "away" || v.status === "left") return false;

        const { latestAgentLeftIdx, latestUserMsgIdx } = getLatestIndices(v);

        // If there is no agent left message but there is a user message
        if (latestAgentLeftIdx === -1 && latestUserMsgIdx !== -1) return true;

        // If there is an agent left message and user messaged after agent left
        if (latestAgentLeftIdx !== -1 && latestUserMsgIdx > latestAgentLeftIdx)
          return true;

        // Otherwise, not incoming
        return false;
      }),
    [allVisitorsData, leftVisitorIds, getLatestIndices]
  );

  const idleVisitors = useMemo(() => {
    const incomingIds = new Set(incomingMessages.map((v) => v.id));

    return allVisitorsData.filter(
      (v) =>
        v.status === "idle" &&
        (!v.agent || v.agent.length === 0) &&
        !incomingIds.has(v.id)
    );
  }, [allVisitorsData, incomingMessages]);

  const idleVisitorIds = useMemo(
    () => new Set(idleVisitors.map((v) => v.id)),
    [idleVisitors]
  );

  const activeVisitors = useMemo(
    () =>
      allVisitorsData.filter((v) => {
        if (idleVisitorIds.has(v.id) || leftVisitorIds.has(v.id)) return false; // Exclude idle visitors

        // If there is an agent, not active
        if (Array.isArray(v.agent) && v.agent.length > 0) return false;
        if (v.status === "idle" || v.status === "away" || v.status === "left")
          return false;

        const { latestAgentLeftIdx, latestUserMsgIdx } = getLatestIndices(v);

        // No user message and no agent left message
        if (latestUserMsgIdx === -1 && latestAgentLeftIdx === -1) return true;

        // If there is an agent left message
        if (latestAgentLeftIdx !== -1) {
          // If no user message after agent left
          if (
            latestUserMsgIdx === -1 ||
            latestUserMsgIdx <= latestAgentLeftIdx
          ) {
            return true;
          }
        }

        // Otherwise, not active
        return false;
      }),
    [allVisitorsData, idleVisitorIds, leftVisitorIds]
  );

  // Optimized getLeftVisitors with proper cleanup
  const getLeftVisitors = useCallback(
    (sessionId: string): Promise<Visitor | null> => {
      if (!workspaceId) return Promise.resolve(null);

      return new Promise((resolve) => {
        if (!isMountedRef.current) {
          resolve(null);
          return;
        }

        const findOneListenerKey = `findOne:${sessionId}`;
        
        try {
          // Add listener to tracking set
          socketListenersRef.current.add(findOneListenerKey);
          
          socket.emit("FindOneVisitor", sessionId);
          socket.once(findOneListenerKey, (response) => {
            try {
              // Remove listener from tracking set
              socketListenersRef.current.delete(findOneListenerKey);
              
              if (!isMountedRef.current) {
                resolve(null);
                return;
              }

              if (response?.data?.chats) {
                const chatsData = {
                  ...response.data,
                  id: response.data._id,
                  chats: response.data.chats.map((c: any) => ({
                    ...c,
                    timestamp: new Date(c.timestamp),
                  })),
                };
                resolve(chatsData);
              } else {
                resolve(null);
              }
            } catch (err) {
              console.error("Error processing chat data:", err);
              resolve(null);
            }
          });
        } catch (error) {
          console.error("Socket emit getLeftVisitors error:", error);
          socketListenersRef.current.delete(findOneListenerKey);
          resolve(null);
        }
      });
    },
    [workspaceId]
  );

  // IP address warning effect with proper cleanup
  useEffect(() => {
    if (!currentlyServedVisitors.length && !incomingMessages.length) return;
    
    const allVisitors = [...currentlyServedVisitors, ...incomingMessages];
    
    try {
      if (allVisitors.some((visitor) => !visitor.ipAddress)) {
        toast.warning("Some visitor IP addresses could not be found", {
          description: "This may limit geolocation features",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Toast warning error:", error);
    }
  }, [currentlyServedVisitors, incomingMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    currentlyServedVisitors,
    incomingMessages,
    idleVisitors,
    activeVisitors,
    loading,
    leftVisitors,
    getLeftVisitors,
  };
};
