import { useState, useEffect, useCallback } from "react";
import { chatApi } from "@/lib/api/chat";

export const useChatLogs = () => {
  const [chatSessionsState, setChatSessionsState] = useState<
    ChatHistorySummaryType[]
  >([]);
  const [selectedChat, setSelectedChat] =
    useState<conversationSessionType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [editingDepartment, setEditingDepartment] = useState("");
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [exportEmail, setExportEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Filter chats based on search term
  const filteredChats = chatSessionsState.filter(
    (chat) =>
      (chat.visitorName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (chat.lastMessage?.content?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      )
  );

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentChats = filteredChats.slice(startIndex, endIndex);

  // Fetch chat history on component mount and page change
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const params: ChatHistoryParams = {
          page: currentPage,
          limit: itemsPerPage,
        };

        const response = await chatApi.getChatHistory(params);

        setChatSessionsState(response.chatHistory);
        setTotalPages(Math.ceil(response.total / itemsPerPage));
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatHistory();
  }, [currentPage, itemsPerPage]);

  // Update total pages when filtered chats change
  useEffect(() => {
    const total = Math.ceil(filteredChats.length / itemsPerPage);
    if (total !== totalPages) {
      setTotalPages(total);
    }
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [filteredChats, itemsPerPage, currentPage, totalPages]);

  const handleChatSelection = useCallback(
    async (chat: ChatHistorySummaryType) => {
      try {
        setChatSessionsState((prev) =>
          prev.map((c) => ({ ...c, isSelected: false }))
        );

        setChatSessionsState((prev) =>
          prev.map((c) => (c.id === chat.id ? { ...c, isSelected: true } : c))
        );

        setShowRightPanel(true);

        const detailedChat = await chatApi.getChatRoomDetails(chat.id);
        setSelectedChat(detailedChat);
      } catch (error) {
        console.error("Failed to fetch chat details:", error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleChatCheckbox = useCallback((chatId: string) => {
    setSelectedChats((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedChats.length === chatSessionsState.length) {
      setSelectedChats([]);
    } else {
      setSelectedChats(chatSessionsState.map((chat) => chat.id));
    }
  }, [selectedChats.length, chatSessionsState]);

  const handleEditTags = useCallback(() => {
    if (selectedChat) {
      setEditingTags(selectedChat.tags.map((tag) => tag.name));
      setNewTag("");
    }
  }, [selectedChat]);

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && selectedChat) {
      const updatedTags = [...editingTags, newTag.trim()];
      setEditingTags(updatedTags);
      setNewTag("");
    }
  }, [newTag, editingTags, selectedChat]);

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      if (selectedChat) {
        const updatedTags = editingTags.filter((tag) => tag !== tagToRemove);
        setEditingTags(updatedTags);
      }
    },
    [editingTags, selectedChat]
  );

  const handleSaveTags = useCallback(() => {
    if (selectedChat) {
      setSelectedChat({
        ...selectedChat,
        // tags: editingTags.map((tagName) => ({ id: tagName, name: tagName })),
      });
      setEditingTags([]);
      setNewTag("");
    }
  }, [selectedChat, editingTags]);

  const handleEditDepartment = useCallback(() => {
    if (selectedChat) {
      setEditingDepartment(selectedChat.department);
    }
  }, [selectedChat]);

  const handleSaveDepartment = useCallback(() => {
    if (selectedChat) {
      setSelectedChat({ ...selectedChat, department: editingDepartment });
      setEditingDepartment("");
    }
  }, [selectedChat, editingDepartment]);

  const handleBanVisitor = useCallback(() => {
    if (
      selectedChat &&
      confirm(
        `Are you sure you want to ban visitor ${
          selectedChat.visitorDetails.name || selectedChat.visitorId
        }?`
      )
    ) {
      // In a real app, this would call an API to ban the visitor
      alert(
        `Visitor ${
          selectedChat.visitorDetails.name || selectedChat.visitorId
        } has been banned.`
      );
    }
  }, [selectedChat]);

  const handleUserInfoChange = useCallback(
    (field: string, value: string) => {
      if (selectedChat) {
        setSelectedChat({
          ...selectedChat,
          visitorDetails: { ...selectedChat.visitorDetails, [field]: value },
        });
      }
    },
    [selectedChat]
  );

  const handleExportTranscript = useCallback(() => {
    console.log("Sending transcript to:", exportEmail);
    setExportEmail("");
  }, [exportEmail]);

  const refreshChatHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: ChatHistoryParams = {
        page: currentPage,
        limit: itemsPerPage,
      };

      const response = await chatApi.getChatHistory(params);

      setChatSessionsState(response.chatHistory);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
    } catch (error) {
      console.error("Failed to refresh chat history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      // Close right panel if it's open
      if (showRightPanel) {
        setShowRightPanel(false);
        setSelectedChat(null);
      }

      setCurrentPage(newPage);
    },
    [showRightPanel]
  );

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, handlePageChange]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  }, [currentPage, handlePageChange]);

  const handleClose = useCallback(() => {
    setShowRightPanel(false);
    setChatSessionsState((prev) =>
      prev.map((c) => ({ ...c, isSelected: false }))
    );
    setSelectedChats([]);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const handleSearchChange = useCallback(
    async (value: string) => {
      setSearchTerm(value);

      if (value.trim()) {
        try {
          setIsLoading(true);
          const params: ChatSearchParams = {
            query: value,
            page: 1,
            limit: itemsPerPage,
          };

          const response = await chatApi.searchChatHistory(params);
          setChatSessionsState(response.chatHistory);
          setTotalPages(Math.ceil(response.total / itemsPerPage));
          setCurrentPage(1);
        } catch (error) {
          console.error("Failed to search chat history:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // If search is cleared, refresh with normal chat history
        refreshChatHistory();
      }
    },
    [itemsPerPage, refreshChatHistory]
  );

  const handleExportEmailChange = useCallback((value: string) => {
    setExportEmail(value);
  }, []);

  const handleCancelTagEdit = useCallback(() => {
    setEditingTags([]);
    setNewTag("");
  }, []);

  const handleCancelDepartmentEdit = useCallback(() => {
    setEditingDepartment("");
  }, []);

  const handleNewTagChange = useCallback((value: string) => {
    setNewTag(value);
  }, []);

  const handleDepartmentChange = useCallback((value: string) => {
    setEditingDepartment(value);
  }, []);

  return {
    // State
    chatSessionsState,
    selectedChat,
    searchTerm,
    selectedChats,
    currentPage,
    totalPages,
    editingTags,
    newTag,
    editingDepartment,
    showRightPanel,
    exportEmail,
    isLoading,
    filteredChats,
    currentChats,

    // Actions
    handleChatSelection,
    handleChatCheckbox,
    handleSelectAll,
    handleEditTags,
    handleAddTag,
    handleRemoveTag,
    handleSaveTags,
    handleEditDepartment,
    handleSaveDepartment,
    handleBanVisitor,
    handleUserInfoChange,
    handleExportTranscript,
    handlePageChange,
    handleNextPage,
    handlePrevPage,
    handleClose,
    handleClearSearch,
    handleSearchChange,
    handleExportEmailChange,
    handleCancelTagEdit,
    handleCancelDepartmentEdit,
    handleNewTagChange,
    handleDepartmentChange,
    refreshChatHistory,
  };
};
