import React from "react";
import { Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatTranscript } from "./ChatTranscript";

interface ChatExportTabProps {
  selectedChat: conversationSessionType | null;
  exportEmail: string;
  onExportEmailChange: (value: string) => void;
  onExportTranscript: () => void;
  onDownloadTranscript: () => void;
  onViewLink: (chat: conversationSessionType | null) => void;
}

const ChatExportTab: React.FC<ChatExportTabProps> = ({
  selectedChat,
  exportEmail,
  onExportEmailChange,
  onExportTranscript,
  onDownloadTranscript,
  onViewLink,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          Export chat transcript
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewLink(selectedChat)}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          View link
        </Button>
      </div>

      <p className="text-gray-600">
        Email chat transcript to recipient(s) or view via link (accessible only
        when signed in).
      </p>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Enter email address(es), separated by commas"
            value={exportEmail}
            onChange={(e) => onExportEmailChange(e.target.value)}
            className="flex-1"
          />
          <div className="w-6 h-6 text-gray-400">
            <Mail />
          </div>
        </div>

        {/* Chat Transcript Preview */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">
            Chat transcript preview:
          </div>
          <div className="bg-white p-4 rounded border max-h-60 overflow-y-auto">
            <ChatTranscript messages={selectedChat?.messages || []} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onDownloadTranscript}>
          <Download className="w-4 h-4 mr-2" />
          Download transcript
        </Button>
        <Button onClick={onExportTranscript} disabled={!exportEmail.trim()}>
          Email transcript
        </Button>
      </div>
    </div>
  );
};

export default ChatExportTab;
