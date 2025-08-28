"use client";

import { useMemo, useState } from "react";
import { VisitorSection } from "@/components/visitor/VisitorSection";
import VisitorSkeleton from "@/components/skeleton/visitor-skeleton";
import { useVisitorContext } from "@/context/VisitorContext";
import { useSelector } from "react-redux";

const Visitors = () => {
  const [currentlyServedExpanded, setCurrentlyServedExpanded] = useState(true);
  const [incomingMessagesExpanded, setIncomingMessagesExpanded] =
    useState(true);
  const [idleMessagesExpanded, setIdleMessagesExpanded] = useState(true);
  const [activeMessagesExpanded, setActiveMessagesExpanded] = useState(true);

  const {
    active: activeVisitors,
    idle: idleVisitors,
    incoming: incomingMessages,
    currentlyServed: currentlyServedVisitors,
    loading,
  } = useSelector((state: RootReducerState) => state.visitors);

  const allVisitorChats = useMemo(() => {
    return [
      ...activeVisitors,
      ...idleVisitors,
      ...incomingMessages,
      ...currentlyServedVisitors,
    ];
  }, [activeVisitors, idleVisitors, incomingMessages, currentlyServedVisitors]);

  const { handleOpenChat } = useVisitorContext();

  return (
    <div className="space-y-4 flex-1 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Visitors</h2>
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {allVisitorChats.length}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between"></div>
        {(loading || allVisitorChats.length === 0) &&
          (loading ? (
            <VisitorSkeleton />
          ) : (
            <div className="p-8 text-center text-muted-foreground rounded-md border">
              No conversations yet.
            </div>
          ))}

        {currentlyServedVisitors.length > 0 && (
          <VisitorSection
            title="Currently served"
            visitors={currentlyServedVisitors}
            expanded={currentlyServedExpanded}
            setExpanded={setCurrentlyServedExpanded}
            onVisitorClick={handleOpenChat}
            iconType="chat"
            showAgent
          />
        )}

        {incomingMessages.length > 0 && (
          <VisitorSection
            title="Incoming chats"
            visitors={incomingMessages}
            expanded={incomingMessagesExpanded}
            setExpanded={setIncomingMessagesExpanded}
            onVisitorClick={handleOpenChat}
            iconType="incoming"
            showMessage
          />
        )}

        {activeVisitors.length > 0 && (
          <VisitorSection
            title="Active chats"
            visitors={activeVisitors}
            expanded={activeMessagesExpanded}
            setExpanded={setActiveMessagesExpanded}
            onVisitorClick={handleOpenChat}
            iconType="eye"
          />
        )}

        {idleVisitors.length > 0 && (
          <VisitorSection
            title="Idle chats"
            visitors={idleVisitors}
            expanded={idleMessagesExpanded}
            setExpanded={setIdleMessagesExpanded}
            onVisitorClick={handleOpenChat}
            iconType="idle"
            showAgent
            showMessage
          />
        )}
      </div>
    </div>
  );
};

export default Visitors;
