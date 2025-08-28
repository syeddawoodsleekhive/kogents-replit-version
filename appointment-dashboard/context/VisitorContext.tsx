import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { MinimizedChatBar } from "@/components/visitor/MinimizedChatBar";
import VisitorChat from "@/components/visitor/VisitorChat";
import { useChatNotifier } from "@/hooks/useChatNotifier";
import { useAgentSocket } from "@/hooks/useAgentSocket";
import { useChatEvents } from "@/hooks/useChatEvents";
import { useSelector, useDispatch } from "react-redux";
import { openChat, removeMinimizedChat } from "@/api/v2/chat";

interface VisitorContextType {
  handleCloseChat: () => void;
  handleOpenChat: (roomId: string) => void;
}

const VisitorContext = createContext<VisitorContextType | undefined>(undefined);

export const VisitorProvider = ({ children }: { children: ReactNode }) => {
  const minimizedChatRef = useRef<HTMLDivElement>(null);

  const [switchingChat, setSwitchingChat] = useState<boolean>(false);
  const [exitingChat, setExitingChat] = useState<string>("");
  const initializedChats = useRef<boolean>(false);
  const isFirstLoad = useRef(true);

  const { activeChatId, minimizedChats } = useSelector(
    (state: RootReducerState) => state.chat
  );

  const { handleChatActivate, handleChatMinimize } = useChatEvents();
  const dispatch: AppReducerDispatch = useDispatch();

  const { getRoomData } = useAgentSocket({});

  const activeChat = useMemo(() => {
    if (!activeChatId) return null;

    return {
      id: activeChatId,
      roomId: activeChatId,
      name: `Visitor ${activeChatId.slice(0, 8)}`,
    };
  }, [activeChatId]);

  const handleMinimizeChat = useCallback(() => {
    if (activeChat) {
      handleChatMinimize();
    }
  }, [activeChat, handleChatMinimize]);

  const removeMinimizedChats = useCallback(
    (roomId: string) => {
      dispatch(removeMinimizedChat(roomId));
      if (activeChat?.roomId === roomId) {
        handleChatActivate("");
      }
    },
    [activeChat, handleChatActivate, dispatch]
  );

  const handleCloseChat = useCallback(() => {
    if (activeChat) {
      removeMinimizedChats(activeChat.roomId);
    }
  }, [activeChat, removeMinimizedChats]);

  const { notifyMessage } = useChatNotifier(activeChat?.roomId);

  const handleOpenChat = useCallback(
    (roomId: string) => {
      const result = dispatch(openChat(roomId));

      if (result?.needsFetch) {
        getRoomData(roomId);
      }
    },
    [dispatch, getRoomData]
  );

  const handleActiveMinimizedChat = useCallback(
    (roomId: string) => {
      handleOpenChat(roomId);
      setExitingChat(roomId);
    },
    [handleOpenChat]
  );

  const handleInteractOutside = useCallback((e: any) => {
    if (minimizedChatRef.current?.contains(e.target)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  useEffect(() => {
    if (activeChat && switchingChat) {
      setTimeout(() => {
        setSwitchingChat(false);
      }, 10);
    }
  }, [activeChat, switchingChat]);

  useEffect(() => {
    if (exitingChat) {
      setTimeout(() => {
        setExitingChat("");
      }, 1000);
    }
  }, [exitingChat]);

  return (
    <VisitorContext.Provider
      value={{
        handleCloseChat,
        handleOpenChat,
      }}
    >
      {children}

      {activeChatId && activeChat && (
        <Dialog
          open={!!activeChatId}
          onOpenChange={() => handleChatActivate("")}
        >
          <DialogTitle />
          <DialogDescription className="hidden">
            Chat With Visitor {activeChat.roomId}
          </DialogDescription>
          <DialogContent
            className="p-0 w-full max-w-[1200px] max-w-[90vw] h-[700px] max-h-[90vh] overflow-hidden border-none sm:max-w-[1200px]"
            hideClose
            onInteractOutside={handleInteractOutside}
          >
            <VisitorChat
              roomId={activeChat.roomId}
              onMinimize={handleMinimizeChat}
              onClose={handleCloseChat}
              exitingChat={exitingChat}
            />
          </DialogContent>
        </Dialog>
      )}

      <MinimizedChatBar
        ref={minimizedChatRef}
        minimizedChats={minimizedChats}
        onReopenChat={handleOpenChat}
        allChats={[]}
        removeMinimizedChats={removeMinimizedChats}
        handleActiveMinimizedChat={handleActiveMinimizedChat}
      />
    </VisitorContext.Provider>
  );
};

export const useVisitorContext = () => {
  const context = useContext(VisitorContext);
  if (!context) {
    throw new Error("useVisitorContext must be used within a VisitorProvider");
  }
  return context;
};
