import Axios from "@/lib/axios";

// Action Creators
export const setCategories = (categories: CannedResponseCategory[]) => ({
  type: "SET_CATEGORIES" as const,
  payload: categories,
});

export const setResponses = (responses: CannedResponse[]) => ({
  type: "SET_RESPONSES" as const,
  payload: responses,
});

export const addCategory = (category: CannedResponseCategory) => ({
  type: "ADD_CATEGORY" as const,
  payload: category,
});

export const updateCategory = (
  id: string,
  updates: Partial<CannedResponseCategory>
) => ({
  type: "UPDATE_CATEGORY" as const,
  payload: { id, updates },
});

export const deleteCategory = (id: string) => ({
  type: "DELETE_CATEGORY" as const,
  payload: id,
});

export const addResponse = (response: CannedResponse) => ({
  type: "ADD_RESPONSE" as const,
  payload: response,
});

export const updateResponse = (
  id: string,
  updates: Partial<CannedResponse>
) => ({
  type: "UPDATE_RESPONSE" as const,
  payload: { id, updates },
});

export const deleteResponse = (id: string) => ({
  type: "DELETE_RESPONSE" as const,
  payload: id,
});

export const setLoading = (loading: boolean) => ({
  type: "SET_LOADING" as const,
  payload: loading,
});

export const setError = (error: string | null) => ({
  type: "SET_ERROR" as const,
  payload: error,
});

export const setStats = (stats: {
  totalResponses: number;
  totalCategories: number;
  activeResponses: number;
}) => ({
  type: "SET_STATS" as const,
  payload: stats,
});

// Thunk Actions
export const fetchCategories = (workspaceId: string) => {
  return async (dispatch: AppReducerDispatch) => {
    try {
      dispatch(setError(null));

      const response = await Axios.get(`/canned-responses/categories`);
      const categories = response.data;

      dispatch(setCategories(categories));
      dispatch(
        setStats({
          totalResponses: 0,
          totalCategories: categories.length,
          activeResponses: 0,
        })
      );

      return categories;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch categories";
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const createCategory = (categoryData: {
  name: string;
  color: string;
  description: string;
  sortOrder: number;
}) => {
  return async (dispatch: AppReducerDispatch) => {
    try {
      dispatch(setError(null));

      const response = await Axios.post(
        `/canned-responses/categories`,
        categoryData
      );
      const newCategory = response.data;

      dispatch(addCategory(newCategory));

      return newCategory;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create category";
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const updateCategoryById = (
  id: string,
  updates: Partial<CannedResponseCategory>
) => {
  return async (dispatch: AppReducerDispatch) => {
    try {
      dispatch(setError(null));

      const response = await Axios.put(
        `/canned-responses/categories/${id}`,
        updates
      );
      const updatedCategory = response.data;

      dispatch(updateCategory(id, updatedCategory));

      return updatedCategory;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update category";
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const deleteCategoryById = (id: string) => {
  return async (dispatch: AppReducerDispatch) => {
    try {
      dispatch(setError(null));

      await Axios.delete(`/canned-responses/categories/${id}`);

      dispatch(deleteCategory(id));

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete category";
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const fetchResponses = (
  workspaceId: string,
  params?: {
    category?: string;
    search?: string;
    page?: string;
    limit?: string;
  }
) => {
  return async (dispatch: AppReducerDispatch) => {
    try {
      dispatch(setError(null));

      const response = await Axios.get(`/canned-responses/find`, { params });
      const responses = response.data;

      dispatch(setResponses(responses.cannedResponses));
      dispatch(
        setStats({
          totalResponses: responses.cannedResponses.length,
          totalCategories: 0,
          activeResponses: responses.cannedResponses.filter(
            (r: CannedResponse) => r.isActive
          ).length,
        })
      );

      return responses;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch responses";
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const createResponse = (responseData: CreateCannedResponse) => {
  return async (dispatch: AppReducerDispatch) => {
    try {
      dispatch(setError(null));

      const response = await Axios.post(
        `/canned-responses/create`,
        responseData
      );
      const newResponse = response.data;

      dispatch(addResponse(newResponse));

      return newResponse;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create response";
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const updateResponseById = (
  id: string,
  updates: Partial<CannedResponse>
) => {
  return async (dispatch: AppReducerDispatch) => {
    try {
      dispatch(setError(null));

      const response = await Axios.put(`/canned-responses/${id}`, updates);
      const updatedResponse = response.data;

      dispatch(updateResponse(id, updatedResponse));

      return updatedResponse;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update response";
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const deleteResponseById = (id: string) => {
  return async (dispatch: AppReducerDispatch) => {
    try {
      dispatch(setError(null));

      await Axios.delete(`/canned-responses/${id}`);

      dispatch(deleteResponse(id));

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete response";
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// Export function for external use
export const exportResponses = async (workspaceId: string) => {
  try {
    const response = await Axios.get(`/canned-responses/find`, {
      params: { limit: "1000" }, // Get all responses
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const importResponses = async (
  responses: Array<{
    title: string;
    content: string;
    shortcut: string;
    categoryId: string;
    tags: string[];
    isActive: boolean;
    cannedResponseFolderId?: string;
  }>
) => {
  try {
    const promises = responses.map((responseData) =>
      Axios.post(`/canned-responses/create`, responseData)
    );
    await Promise.all(promises);
    return { success: true };
  } catch (error) {
    throw error;
  }
};
