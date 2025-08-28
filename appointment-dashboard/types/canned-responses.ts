export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  shortcut?: string;
  categoryId?: string;
  category: string;
  tags: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CannedResponseCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface CannedResponseFilters {
  category?: string;
  search?: string;
  tags?: string[];
}
