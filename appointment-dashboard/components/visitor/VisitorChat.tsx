"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VisitorRightSideBar from "./_partials/VisitorRightSideBar";
import { useSelector } from "react-redux";
import { useChatEvents } from "@/hooks/useChatEvents";
import { useAgentSocket } from "@/hooks/useAgentSocket";
import ChatMessagesWindow from "./_partials/ChatMessagesWindow";
import MessageInput from "./_partials/MessageInput";
import VisitorChatHead from "./_partials/VisitorChatHead";
import ConfirmClose from "./_partials/ConfirmClose";
import { useReadReceipts } from "@/hooks/useReadReceipts";
import PastChatHistory from "./_partials/PastChatHistory";
import ActionModals from "./_partials/ActionModals";
import TranslationBar from "./_partials/TranslationBar";

interface VisitorChatProps {
  roomId: string;
  onMinimize: () => void;
  onClose: () => void;
  exitingChat: string;
}

const VisitorChat = ({
  roomId,
  onMinimize,
  onClose,
  exitingChat,
}: VisitorChatProps) => {
  const joinedRooms = useSelector(
    (state: RootReducerState) => state.chat.joinedRooms
  );

  const roomDetails = useSelector(
    (state: RootReducerState) => state.chat.roomDetails[roomId]
  );

  const joinedChat = useMemo(() => {
    return joinedRooms.includes(roomId);
  }, [joinedRooms, roomId]);

  const [visitorLeftConfirmJoin, setVisitorLeftConfirmJoin] =
    useState<boolean>(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [chatHistoryId, setChatHistoryId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<actionModalType>("");

  const { chatMessages, typingStates } = useChatEvents();

  const currentMessages = useMemo(() => {
    return chatMessages[roomId] || [];
  }, [chatMessages, roomId]);

  const isTyping = useMemo(() => {
    if (typeof typingStates === "object" && typingStates !== null) {
      const typingState = typingStates[roomId];
      return typingState?.isTyping || false;
    }
    return false;
  }, [typingStates, roomId]);

  const {
    connected,
    sendMessage,
    emitTypingStatus,
    leaveRoom,
    joinRoom,
    closeRoom,
    sendOrQueueMessage,
    assignTagToChat,
    unassignTagFromChat,
  } = useAgentSocket({});

  const { sendReadReceiptsForUnread } = useReadReceipts(roomId);

  useEffect(() => {
    if (exitingChat === roomId && !confirmClose) {
      setConfirmClose(true);
    }
  }, [roomId, exitingChat]);

  const handleJoinRoom = useCallback(() => {
    joinRoom(roomId);
  }, [joinRoom, roomId]);

  const handleLeaveRoom = useCallback(() => {
    leaveRoom(roomId);
  }, [leaveRoom, roomId]);

  const visitorDetail = useMemo(() => {
    if (!roomDetails) return { name: "", email: "", phone: "", note: "" };

    return {
      name: roomDetails.visitorDetails?.name,
      email: roomDetails.visitorDetails?.email || "",
      phone: roomDetails.visitorDetails?.phone || "",
      note: "",
    };
  }, [roomDetails]);

  const visitorName = useMemo(() => {
    return visitorDetail && visitorDetail.name
      ? visitorDetail.name
      : `Visitor ${roomDetails?.visitorId || ""}`;
  }, [visitorDetail?.name, roomDetails?.visitorId]);

  const onCloseHandler = (quit = false) => {
    if (joinedChat && !quit && !visitorLeftConfirmJoin) {
      setConfirmClose(true);
    } else {
      if (joinedChat) {
        handleLeaveRoom();
      } else {
        closeRoom(roomId);
      }
      onClose();
    }
  };

  const handleMinimize = () => {
    onMinimize();
  };

  const handleContinueChat = () => {
    setVisitorLeftConfirmJoin(false);
    handleJoinRoom();
  };

  const handleTabChange = () => {
    setChatHistoryId(null);
  };

  if (!roomDetails) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full overflow-hidden">
      <VisitorChatHead
        roomDetails={roomDetails}
        visitorName={visitorName}
        confirmClose={confirmClose}
        handleMinimize={handleMinimize}
        onCloseHandler={onCloseHandler}
        setActionModal={setActionModal}
      />
      <div className="flex flex-1 w-full overflow-hidden relative">
        {confirmClose ? (
          <ConfirmClose
            onCloseHandler={onCloseHandler}
            joinedChat={joinedChat}
            setConfirmClose={setConfirmClose}
          />
        ) : actionModal && actionModal !== "translate-chat" ? (
          <ActionModals
            showAction={actionModal}
            setShowAction={setActionModal}
          />
        ) : (
          <>
            <div className="flex flex-col flex-grow border-r max-w-[calc(100%-20rem)]">
              <Tabs
                defaultValue="current"
                className="w-full h-full flex flex-col"
              >
                <div className="bg-gray-100 border-b py-2 px-2">
                  <TabsList className="w-fit justify-start bg-gray-200 text-muted-foreground h-10 p-1 flex items-center rounded-md">
                    <TabsTrigger
                      value="current"
                      className="data-[state=active]:bg-white flex-initial px-4  h-full text-sm border rounded-md"
                      onClick={handleTabChange}
                    >
                      Current chat
                    </TabsTrigger>
                    <TabsTrigger
                      value="passchat"
                      className="data-[state=active]:bg-white flex-initial px-4  h-full text-sm border rounded-md border-l-0"
                    >
                      Past Chats (0)
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent
                  value="current"
                  className="flex-1 flex flex-col mt-0 p-0 h-full max-h-[calc(100%-3.5rem)]"
                >
                  {actionModal && actionModal === "translate-chat" && (
                    <TranslationBar
                      visitor={roomDetails}
                      setActionModal={setActionModal}
                    />
                  )}
                  <ChatMessagesWindow
                    currentMessages={currentMessages}
                    visitorName={visitorName}
                    isTyping={isTyping}
                    visitorPath={
                      roomDetails.visitorSessionDetails.visitorPageTracking
                        .navigationPath
                    }
                  />
                  <MessageInput
                    joinedChat={joinedChat}
                    connected={connected}
                    emitTypingStatus={emitTypingStatus}
                    roomId={roomId}
                    visitorLeftConfirmJoin={visitorLeftConfirmJoin}
                    visitorName={visitorName}
                    handleJoinRoom={handleJoinRoom}
                    handleContinueChat={handleContinueChat}
                    confirmClose={confirmClose}
                    sendMessage={sendMessage}
                    emitSocketEvent={sendOrQueueMessage}
                  />
                </TabsContent>
                <TabsContent
                  value="passchat"
                  className="bg-gray-100 h-full overflow-y-auto -mt-2"
                >
                  <PastChatHistory
                    chatHistoryId={chatHistoryId}
                    pastChats={[]}
                    setChatHistoryId={setChatHistoryId}
                  />
                </TabsContent>
              </Tabs>
            </div>
            <VisitorRightSideBar
              roomDetails={roomDetails}
              connected={joinedChat}
              visitorLeft={visitorLeftConfirmJoin}
              assignTagToChat={assignTagToChat}
              unassignTagFromChat={unassignTagFromChat}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default VisitorChat;
