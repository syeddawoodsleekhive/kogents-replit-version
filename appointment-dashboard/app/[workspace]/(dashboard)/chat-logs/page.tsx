"use client";
import React from "react";
import ChatLogsHeader from "@/components/chat-logs/ChatLogsHeader";
import ChatLogsTable from "@/components/chat-logs/ChatLogsTable";
import ChatRightPanel from "@/components/chat-logs/ChatRightPanel";
import { useChatLogs } from "@/hooks/useChatLogs";
import { downloadTranscript } from "@/utils/chatLogsUtils";
import { handleViewLink } from "@/functions/chat-logs";

const ChatLogsPage: React.FC = () => {
  const {
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
  } = useChatLogs();

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* Left Sidebar - Chat Sessions List */}
      <div className="bg-white flex flex-col w-full">
        <ChatLogsHeader
          searchTerm={searchTerm}
          currentPage={currentPage}
          totalPages={totalPages}
          selectedChats={selectedChats}
          chatSessionsCount={chatSessionsState.length}
          showRightPanel={showRightPanel}
          isLoading={isLoading}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          onSelectAll={handleSelectAll}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
        />

        <ChatLogsTable
          chatSessions={chatSessionsState}
          selectedChats={selectedChats}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={10}
          isLoading={isLoading}
          onChatSelection={handleChatSelection}
          onChatCheckbox={handleChatCheckbox}
          onSelectAll={handleSelectAll}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
        />
      </div>

      {/* Right Panel - Chat Details */}
      <ChatRightPanel
        showRightPanel={showRightPanel}
        selectedChat={selectedChat}
        editingTags={editingTags}
        editingDepartment={editingDepartment}
        newTag={newTag}
        exportEmail={exportEmail}
        onEditTags={handleEditTags}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        onSaveTags={handleSaveTags}
        onEditDepartment={handleEditDepartment}
        onSaveDepartment={handleSaveDepartment}
        onDepartmentChange={handleDepartmentChange}
        onNewTagChange={handleNewTagChange}
        onCancelTagEdit={handleCancelTagEdit}
        onCancelDepartmentEdit={handleCancelDepartmentEdit}
        onUserInfoChange={handleUserInfoChange}
        onBanVisitor={handleBanVisitor}
        onClose={handleClose}
        onExportTranscript={handleExportTranscript}
        onExportEmailChange={handleExportEmailChange}
        onDownloadTranscript={() => downloadTranscript(selectedChat)}
        onViewLink={() => handleViewLink(selectedChat || undefined)}
      />
    </div>
  );
};

export default ChatLogsPage;
