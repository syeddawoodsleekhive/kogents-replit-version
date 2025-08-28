import React, { useCallback, useEffect, useState } from "react";
import { X, Ban, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatTranscriptTab from "./ChatTranscriptTab";
import ChatUserInfoTab from "./ChatUserInfoTab";
import ChatMetricsTab from "./ChatMetricsTab";
import ChatExportTab from "./ChatExportTab";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

interface ChatRightPanelProps {
  showRightPanel: boolean;
  selectedChat: conversationSessionType | null;
  editingTags: string[];
  editingDepartment: string;
  newTag: string;
  exportEmail: string;
  onEditTags: () => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onSaveTags: () => void;
  onEditDepartment: () => void;
  onSaveDepartment: () => void;
  onDepartmentChange: (value: string) => void;
  onNewTagChange: (value: string) => void;
  onCancelTagEdit: () => void;
  onCancelDepartmentEdit: () => void;
  onUserInfoChange: (field: string, value: string) => void;
  onBanVisitor: () => void;
  onClose: () => void;
  onExportTranscript: () => void;
  onExportEmailChange: (value: string) => void;
  onDownloadTranscript: () => void;
  onViewLink: (chat: conversationSessionType | null) => void;
}

const ChatRightPanel: React.FC<ChatRightPanelProps> = ({
  showRightPanel,
  selectedChat,
  editingTags,
  editingDepartment,
  newTag,
  exportEmail,
  onEditTags,
  onAddTag,
  onRemoveTag,
  onSaveTags,
  onEditDepartment,
  onSaveDepartment,
  onDepartmentChange,
  onNewTagChange,
  onCancelTagEdit,
  onCancelDepartmentEdit,
  onUserInfoChange,
  onBanVisitor,
  onClose,
  onExportTranscript,
  onExportEmailChange,
  onDownloadTranscript,
  onViewLink,
}) => {
  const [activeTab, setActiveTab] = useState("transcript");

  const onTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    return () => {
      if (!showRightPanel) {
        setActiveTab("transcript");
      }
    };
  }, [showRightPanel]);

  if (!showRightPanel) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case "transcript":
        return (
          <ChatTranscriptTab
            selectedChat={selectedChat}
            editingTags={editingTags}
            editingDepartment={editingDepartment}
            newTag={newTag}
            onEditTags={onEditTags}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
            onSaveTags={onSaveTags}
            onEditDepartment={onEditDepartment}
            onSaveDepartment={onSaveDepartment}
            onDepartmentChange={onDepartmentChange}
            onNewTagChange={onNewTagChange}
            onCancelTagEdit={onCancelTagEdit}
            onCancelDepartmentEdit={onCancelDepartmentEdit}
          />
        );
      case "userInfo":
        return (
          <ChatUserInfoTab
            selectedChat={selectedChat}
            onUserInfoChange={onUserInfoChange}
          />
        );
      case "callerInfo":
        return <ChatMetricsTab selectedChat={selectedChat} />;
      case "export":
        return (
          <ChatExportTab
            selectedChat={selectedChat}
            exportEmail={exportEmail}
            onExportEmailChange={onExportEmailChange}
            onExportTranscript={onExportTranscript}
            onDownloadTranscript={onDownloadTranscript}
            onViewLink={onViewLink}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] fixed top-[64px] right-0 bg-white flex flex-col border border-l border-t-0 w-1/2">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Tabs defaultValue="transcript">
              <TabsList>
                <TabsTrigger
                  value="transcript"
                  onClick={() => onTabChange("transcript")}
                >
                  Transcript
                </TabsTrigger>
                <TabsTrigger
                  value="userInfo"
                  onClick={() => onTabChange("userInfo")}
                >
                  Visitor info
                </TabsTrigger>
                <TabsTrigger
                  value="callerInfo"
                  onClick={() => onTabChange("callerInfo")}
                >
                  Metrics
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "userInfo" && (
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
                onClick={onBanVisitor}
              >
                <Ban className="w-4 h-4" />
                Ban visitor
              </Button>
            )}
            <Button
              onClick={() => onTabChange("export")}
              className={`px-3 py-2 text-sm font-medium rounded-md flex items-center gap-2 
                   border border-gray-200 hover:bg-black hover:text-white ${
                     activeTab === "export"
                       ? "bg-black text-white"
                       : "bg-white text-black"
                   }`}
              size="sm"
            >
              <Download />
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">{renderTabContent()}</div>
    </div>
  );
};

export default ChatRightPanel;
