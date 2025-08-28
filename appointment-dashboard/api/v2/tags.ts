import Axios from "@/lib/axios";

export const fetchTagCategories = () => async (dispatch: any) => {
  try {
    dispatch(setTagsError(null));

    const response = await Axios.get(`/tags/categories`);
    const categories = response.data;

    dispatch(setTagCategories(categories));
    dispatch(setTagsStats({ totalTagCategories: categories.length }));

    return categories;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch tag categories";
    dispatch(setTagsError(errorMessage));
    throw error;
  } finally {
    dispatch(setTagsLoading(false));
  }
};

export const createTagCategory =
  (categoryData: CreateTagCategoryRequest) => async (dispatch: any) => {
    try {
      dispatch(setTagsError(null));

      const response = await Axios.post(`/tags/categories`, categoryData);
      const newCategory = response.data;

      dispatch(addTagCategory(newCategory));

      const currentState =
        (dispatch as any).getState?.()?.tags?.tagsStats?.totalTagCategories ||
        0;
      dispatch(setTagsStats({ totalTagCategories: currentState + 1 }));

      return newCategory;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create tag category";
      dispatch(setTagsError(errorMessage));
      throw error;
    } finally {
      dispatch(setTagsLoading(false));
    }
  };

export const updateTagCategory =
  (id: string, updates: UpdateTagCategoryRequest) => async (dispatch: any) => {
    try {
      dispatch(setTagsError(null));

      const response = await Axios.put(`/tags/categories/${id}`, updates);
      const updatedCategory = response.data;

      dispatch(updateTagCategoryById(id, updatedCategory));

      return updatedCategory;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update tag category";
      dispatch(setTagsError(errorMessage));
      throw error;
    } finally {
      dispatch(setTagsLoading(false));
    }
  };

export const deleteTagCategory = (id: string) => async (dispatch: any) => {
  try {
    dispatch(setTagsError(null));

    await Axios.delete(`/tags/categories/${id}`);

    dispatch(deleteTagCategoryById(id));

    const currentState =
      (dispatch as any).getState?.()?.tags?.tagsStats?.totalTagCategories || 0;
    dispatch(setTagsStats({ totalTagCategories: currentState - 1 }));

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete tag category";
    dispatch(setTagsError(errorMessage));
    throw error;
  } finally {
    dispatch(setTagsLoading(false));
  }
};

export const fetchTags =
  (params?: TagsQueryParams) => async (dispatch: any) => {
    try {
      dispatch(setTagsError(null));

      const queryParams = new URLSearchParams();
      if (params?.categoryId)
        queryParams.append("categoryId", params.categoryId);
      if (params?.search) queryParams.append("search", params.search);
      if (params?.page) queryParams.append("page", params.page);
      if (params?.limit) queryParams.append("limit", params.limit);

      const response = await Axios.get(`/tags?${queryParams.toString()}`);
      const tags = response.data.tags;

      dispatch(setTags(tags));

      return tags;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch tags";
      dispatch(setTagsError(errorMessage));
      throw error;
    } finally {
      dispatch(setTagsLoading(false));
    }
  };

export const createTag =
  (tagData: CreateTagRequest) => async (dispatch: any) => {
    try {
      dispatch(setTagsError(null));

      const response = await Axios.post(`/tags`, tagData);
      const newTag = response.data;

      dispatch(addTag(newTag));

      const currentState =
        (dispatch as any).getState?.()?.tags?.tagsStats?.totalTags || 0;
      dispatch(setTagsStats({ totalTags: currentState + 1 }));

      return newTag;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create tag";
      dispatch(setTagsError(errorMessage));
      throw error;
    } finally {
      dispatch(setTagsLoading(false));
    }
  };

export const updateTag =
  (id: string, updates: UpdateTagRequest) => async (dispatch: any) => {
    try {
      dispatch(setTagsError(null));

      const response = await Axios.put(`/tags/${id}`, updates);
      const updatedTag = response.data;

      dispatch(updateTagById(id, updatedTag));

      return updatedTag;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update tag";
      dispatch(setTagsError(errorMessage));
      throw error;
    } finally {
      dispatch(setTagsLoading(false));
    }
  };

export const deleteTag = (id: string) => async (dispatch: any) => {
  try {
    dispatch(setTagsError(null));

    await Axios.delete(`/tags/${id}`);

    dispatch(deleteTagById(id));

    const currentState =
      (dispatch as any).getState?.()?.tags?.tagsStats?.totalTags || 0;
    dispatch(setTagsStats({ totalTags: currentState - 1 }));

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete tag";
    dispatch(setTagsError(errorMessage));
    throw error;
  } finally {
    dispatch(setTagsLoading(false));
  }
};

export const setTags = (tags: Tag[]) => ({
  type: "SET_TAGS" as const,
  payload: tags,
});

export const setTagCategories = (categories: TagCategory[]) => ({
  type: "SET_TAG_CATEGORIES" as const,
  payload: categories,
});

export const addTag = (tag: Tag) => ({
  type: "ADD_TAG" as const,
  payload: tag,
});

export const updateTagById = (id: string, updates: Partial<Tag>) => ({
  type: "UPDATE_TAG" as const,
  payload: { id, updates },
});

export const deleteTagById = (id: string) => ({
  type: "DELETE_TAG" as const,
  payload: id,
});

export const addTagCategory = (category: TagCategory) => ({
  type: "ADD_TAG_CATEGORY" as const,
  payload: category,
});

export const updateTagCategoryById = (
  id: string,
  updates: Partial<TagCategory>
) => ({
  type: "UPDATE_TAG_CATEGORY" as const,
  payload: { id, updates },
});

export const deleteTagCategoryById = (id: string) => ({
  type: "DELETE_TAG_CATEGORY" as const,
  payload: id,
});

export const setTagsLoading = (loading: boolean) => ({
  type: "SET_TAGS_LOADING" as const,
  payload: loading,
});

export const setTagsError = (error: string | null) => ({
  type: "SET_TAGS_ERROR" as const,
  payload: error,
});

export const setTagsStats = (
  stats: Partial<{ totalTags: number; totalTagCategories: number }>
) => ({
  type: "SET_TAGS_STATS" as const,
  payload: stats,
});
