interface CannedResponseCategory {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface CannedResponse {
  id: string;
  workspaceId?: string;
  title: string;
  content: string;
  shortcut?: string;
  categoryId?: string;
  category: CannedResponseCategory;
  tags: string[];
  isActive?: boolean;
  isSystem?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  cannedResponseFolderId?: string;
  usageCount?: number;
}

interface CreateCannedResponseCategory
  extends Omit<
    CannedResponseCategory,
    "id" | "createdAt" | "updatedAt" | "workspaceId"
  > {}

interface CreateCannedResponse
  extends Omit<
    CannedResponse,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "usageCount"
    | "createdBy"
    | "workspaceId"
    | "category"
  > {}

interface CannedResponsesState {
  categories: CannedResponseCategory[];
  responses: CannedResponse[];
  loading: boolean;
  error: string | null;
  stats: {
    totalResponses: number;
    totalCategories: number;
    activeResponses: number;
  };
}

// Action Types
type CannedResponsesActionTypes =
  | SetCategoriesActionType
  | SetResponsesActionType
  | AddCategoryActionType
  | UpdateCategoryActionType
  | DeleteCategoryActionType
  | AddResponseActionType
  | UpdateResponseActionType
  | DeleteResponseActionType
  | SetLoadingActionType
  | SetErrorActionType
  | SetStatsActionType;

interface SetCategoriesActionType {
  type: "SET_CATEGORIES";
  payload: CannedResponseCategory[];
}

interface SetResponsesActionType {
  type: "SET_RESPONSES";
  payload: CannedResponse[];
}

interface AddCategoryActionType {
  type: "ADD_CATEGORY";
  payload: CannedResponseCategory;
}

interface UpdateCategoryActionType {
  type: "UPDATE_CATEGORY";
  payload: { id: string; updates: Partial<CannedResponseCategory> };
}

interface DeleteCategoryActionType {
  type: "DELETE_CATEGORY";
  payload: string;
}

interface AddResponseActionType {
  type: "ADD_RESPONSE";
  payload: CannedResponse;
}

interface UpdateResponseActionType {
  type: "UPDATE_RESPONSE";
  payload: { id: string; updates: Partial<CannedResponse> };
}

interface DeleteResponseActionType {
  type: "DELETE_RESPONSE";
  payload: string;
}

interface SetLoadingActionType {
  type: "SET_LOADING";
  payload: boolean;
}

interface SetErrorActionType {
  type: "SET_ERROR";
  payload: string | null;
}

interface SetStatsActionType {
  type: "SET_STATS";
  payload: {
    totalResponses: number;
    totalCategories: number;
    activeResponses: number;
  };
}
