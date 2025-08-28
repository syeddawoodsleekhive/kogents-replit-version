export interface ConversationTag {
  _id: string;
  id: string;
  name: string;
  color: string;
  category?: TagCategory;
  createdAt: Date;
  createdBy: string;
  dontRemove?: boolean;
}

export interface TagCategory {
  _id: string;
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface ConversationTagAssignment {
  conversationId: string;
  tagId: string;
  assignedAt: Date;
  assignedBy: string;
}

export interface TagStats {
  tagId: string;
  name: string;
  usageCount: number;
  lastUsed: Date;
}

export type TagOperation = "add" | "remove" | "update";

export interface TagOperationPayload {
  operation: TagOperation;
  conversationId: string;
  tag: ConversationTag;
  assignedBy: string;
}

export interface BulkTagOperation {
  operation: "add" | "remove" | "replace";
  conversationIds: string[];
  tagIds: string[];
  assignedBy: string;
}

export interface BulkTagResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors?: string[];
}
