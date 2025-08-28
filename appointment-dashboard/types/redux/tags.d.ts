// Tag Types
interface Tag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  description: string;
  categoryId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignedBy?: string;
}

interface TagCategory {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  description: string;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// API Request Types
interface CreateTagRequest {
  name: string;
  color: string;
  description: string;
  categoryId: string;
}

interface UpdateTagRequest {
  name?: string;
  color?: string;
  description?: string;
  categoryId?: string;
}

interface CreateTagCategoryRequest {
  name: string;
  color: string;
  description: string;
  sortOrder: number;
}

interface UpdateTagCategoryRequest {
  name?: string;
  color?: string;
  description?: string;
  sortOrder?: number;
}

interface TagsQueryParams {
  categoryId?: string;
  search?: string;
  page?: string;
  limit?: string;
}

// Redux State Types
interface TagsReducerStateType {
  tags: Tag[];
  tagCategories: TagCategory[];
  tagsLoading: boolean;
  tagsError: string | null;
  tagsStats: {
    totalTags: number;
    totalTagCategories: number;
  };
}

// Action Types - All with unique names
type TagsActionTypes =
  | SetTagsActionType
  | SetTagCategoriesActionType
  | AddTagActionType
  | UpdateTagActionType
  | DeleteTagActionType
  | AddTagCategoryActionType
  | UpdateTagCategoryActionType
  | DeleteTagCategoryActionType
  | SetTagsLoadingActionType
  | SetTagsErrorActionType
  | SetTagsStatsActionType;

interface SetTagsActionType {
  type: "SET_TAGS";
  payload: Tag[];
}

interface SetTagCategoriesActionType {
  type: "SET_TAG_CATEGORIES";
  payload: TagCategory[];
}

interface AddTagActionType {
  type: "ADD_TAG";
  payload: Tag;
}

interface UpdateTagActionType {
  type: "UPDATE_TAG";
  payload: { id: string; updates: Partial<Tag> };
}

interface DeleteTagActionType {
  type: "DELETE_TAG";
  payload: string;
}

interface AddTagCategoryActionType {
  type: "ADD_TAG_CATEGORY";
  payload: TagCategory;
}

interface UpdateTagCategoryActionType {
  type: "UPDATE_TAG_CATEGORY";
  payload: { id: string; updates: Partial<TagCategory> };
}

interface DeleteTagCategoryActionType {
  type: "DELETE_TAG_CATEGORY";
  payload: string;
}

interface SetTagsLoadingActionType {
  type: "SET_TAGS_LOADING";
  payload: boolean;
}

interface SetTagsErrorActionType {
  type: "SET_TAGS_ERROR";
  payload: string | null;
}

interface SetTagsStatsActionType {
  type: "SET_TAGS_STATS";
  payload: Partial<TagsReducerStateType["tagsStats"]>;
}
