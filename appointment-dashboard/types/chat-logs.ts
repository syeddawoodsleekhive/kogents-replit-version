export interface ChatTranscriptEntry {
  type: "system" | "agent" | "visitor";
  message: string;
  time: string;
}

export interface ChatUserInfo {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  pastVisits?: number;
  pastChats?: number;
  location?: string;
  browser?: string;
  platform?: string;
  device?: string;
  ipAddress?: string;
  userAgent?: string;
  visitorPath?: Array<{
    source: string;
    type: string;
  }>;
}

export interface ChatSession {
  id: string;
  name: string;
  agent: string;
  time: string;
  department: string;
  messages: number;
  content: string;
  isSelected: boolean;
  tags: string[];
  transcript: ChatTranscriptEntry[];
  userInfo?: ChatUserInfo;
}

export interface ChatLogsState {
  chatSessions: ChatSession[];
  selectedChat: ChatSession | null;
  activeTab: string;
  searchTerm: string;
  selectedChats: string[];
  currentPage: number;
  totalPages: number;
  showRightPanel: boolean;
  isLoading: boolean;
  editingTags: string[];
  newTag: string;
  editingDepartment: string;
  exportEmail: string;
}

export interface ChatLogsActions {
  onChatSelection: (chat: ChatSession) => void;
  onChatCheckbox: (chatId: string) => void;
  onSelectAll: () => void;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
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
  onViewTranscriptLink: () => void;
}
