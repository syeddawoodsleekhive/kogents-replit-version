import { Edit3, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChatTranscript } from "./ChatTranscript";

interface ChatTranscriptTabProps {
  selectedChat: conversationSessionType | null;
  editingTags: string[];
  editingDepartment: string;
  newTag: string;
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
}

const ChatTranscriptTab = ({
  selectedChat,
  editingTags,
  editingDepartment,
  newTag,
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
}: ChatTranscriptTabProps) => {
  if (editingTags.length > 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-left mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Edit chat tags
          </h3>
        </div>

        {/* Tag Editing Interface */}
        <div className="space-y-4">
          <Input
            placeholder="Add chat tags"
            value={newTag}
            onChange={(e) => onNewTagChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                onAddTag();
              }
            }}
            className="w-full max-w-md border-gray-300"
          />

          <div className="flex flex-wrap gap-2">
            {editingTags.map((tag, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full"
              >
                <span className="text-xs">{tag}</span>
                <button
                  onClick={() => onRemoveTag(tag)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={onSaveTags} size="sm">
              Save changes
            </Button>
            <Button variant="outline" size="sm" onClick={onCancelTagEdit}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="text-left mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Conversation History
        </h3>
        <p className="text-sm text-gray-500">Connected to AI Agent</p>
      </div>

      {/* Metadata */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Department:</span>
          {editingDepartment !== "" ? (
            <div className="flex items-center gap-2">
              <Input
                value={editingDepartment}
                onChange={(e) => onDepartmentChange(e.target.value)}
                className="w-32"
              />
              <Button size="sm" onClick={onSaveDepartment}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCancelDepartmentEdit}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-500">
                {selectedChat?.department}
              </span>
              <Edit3
                className="w-4 h-4 text-gray-400 cursor-pointer"
                onClick={onEditDepartment}
              />
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Tags:</span>
          <div className="flex flex-wrap gap-2">
            {selectedChat?.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
          <Edit3
            className="w-4 h-4 text-gray-400 cursor-pointer"
            onClick={onEditTags}
          />
        </div>
      </div>

      {/* Chat Transcript */}
      <ChatTranscript messages={selectedChat?.messages || []} />
    </>
  );
};

export default ChatTranscriptTab;
