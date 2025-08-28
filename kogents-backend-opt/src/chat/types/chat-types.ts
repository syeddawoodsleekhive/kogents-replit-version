export interface ConnectionData {
    agentId?: string;
    visitorId?: string;
    sessionId?: string;
    currentDepartmentId?: string;
    roomId?: string;
    token?: string;
    clientIp?: string;
    workspaceId?: string;
    user?: any;
    authenticated?: boolean;
}

export interface ClientMessage {
    roomId: string;
    messageId: string;
    message: string;
    isInternal?: boolean;
}

export interface SystemMessage {
    roomId: string;
    message: string;
    messageId: string;
}

export interface AgentRoom {
    roomId: string;
}

export interface AgentRoomClose {
    roomId: string;
    status: 'CLOSED' | 'MINIMIZED';
    roomInFocus?: string;
}

interface MessageData {
    messageId: string;
    senderId: string;
}

export interface MessageReadOrDeliveredRequest {
    roomId?: string;
    messages: MessageData[];
}

export interface ClientTyping {
    roomId: string;
    isTyping: boolean;
}

export interface TransferChatToAgent {
    targetAgentId: string;
    reason?: string;
    transferId?: string;
}

export interface ChatTransferAcceptOrReject {
    transferId: string;
    roomId: string;
}

export interface InviteAgentToChat {
    targetAgentId: string;
    reason?: string;
    inviteId?: string;
}

export interface ChatInvitationAcceptOrReject {
    inviteId: string;
    roomId: string;
}

export interface TransferChatToDepartment {
    targetDepartmentId: string;
    reason?: string;
    transferId?: string;
}

export interface ChatTransferToDepartmentAcceptOrReject {
    transferId: string;
    roomId: string;
}

export interface InviteDepartmentToChat {
    targetDepartmentId: string;
    reason?: string;
    inviteId?: string;
}

export interface DepartmentInvitationAcceptOrReject {
    inviteId: string;
    roomId: string;
}

export interface VisitorPageChanged {
    // Required fields for immediate tracking
    pageUrl: string;
    pageTitle: string;

    // Other update fields
    pagePath?: string;
    pageHash?: string;
    pageQuery?: string;

    // Real-time engagement metrics
    timeOnPage?: number; // Time spent on previous page
    pageLoadTime?: number; // Current page load time

    // Navigation context
    navigationMethod?: 'click' | 'back' | 'forward' | 'direct' | 'search';
    navigationSource?: 'internal' | 'external' | 'search' | 'social' | 'direct';
    navigationIntent?: 'browse' | 'search' | 'purchase' | 'support';
}

export interface FileAttachment {
    id?: string;
    url: string;
    fileName: string;
    mimeType: string;
    size: number;
    previewUrl?: string;
    width?: number;
    height?: number;
}

export type UploadState = 'uploading' | 'processing' | 'completed' | 'failed';

export interface FileUploadStatus {
    roomId?: string;
    messageId: string;
    uploadId?: string;
    status: UploadState;
    progress?: number;        // 0-100
    errorCode?: string;
    errorMessage?: string;
}

export interface FileMessage {
    roomId: string;
    messageId: string;
    attachment: FileAttachment;
    caption?: string;
    isInternal?: boolean;
    uploadId?: string;
}

export interface VisitorPastChats {
    visitorId: string;
}

export interface AgentChatTag {
    roomId: string;
    tagId: string;
}

export interface VisitorChatTag {
    tagNames: string[];
}

export interface CannedResponseUsage {
    roomId: string;
    cannedResponseId: string;
}

export interface VisitorIdentity {
    visitorId?: string;
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
}

export interface VisitorPostChatForm {
    rating?: number;
    feedback?: string;
}

export interface MessageHistory {
    roomId: string;
    page: number;
    limit: number;
}

export interface ChatError {
    type: 'AUTHENTICATION_ERROR' | 'VALIDATION_ERROR' | 'PERMISSION_ERROR' | 'SYSTEM_ERROR';
    message: string;
    code: string;
    timestamp: Date;
    details?: any;
}