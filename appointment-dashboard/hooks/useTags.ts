import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTags,
  fetchTagCategories,
  createTag,
  updateTag,
  deleteTag,
  createTagCategory,
  updateTagCategory,
  deleteTagCategory,
} from "@/api/v2/tags";

export const useTags = () => {
  const dispatch: AppReducerDispatch = useDispatch();
  const { tags, tagCategories, tagsLoading, tagsError, tagsStats } =
    useSelector((state: RootReducerState) => state.tags);

  const workspace = useSelector(
    (state: RootReducerState) => state.user.workspace
  );

  const getTags = useCallback(
    async (params?: any) => {
      return await dispatch(fetchTags(params));
    },
    [dispatch]
  );

  const addTag = useCallback(
    async (tagData: any) => {
      return await dispatch(createTag(tagData));
    },
    [dispatch]
  );

  const updateTagById = useCallback(
    async (id: string, updates: any) => {
      return await dispatch(updateTag(id, updates));
    },
    [dispatch]
  );

  const deleteTagById = useCallback(
    async (id: string) => {
      return await dispatch(deleteTag(id));
    },
    [dispatch]
  );

  const getTagCategories = useCallback(async () => {
    return await dispatch(fetchTagCategories());
  }, [dispatch]);

  const addCategory = useCallback(
    async (categoryData: any) => {
      return await dispatch(createTagCategory(categoryData));
    },
    [dispatch]
  );

  const updateCategoryById = useCallback(
    async (id: string, updates: any) => {
      return await dispatch(updateTagCategory(id, updates));
    },
    [dispatch]
  );

  const deleteCategoryById = useCallback(
    async (id: string) => {
      return await dispatch(deleteTagCategory(id));
    },
    [dispatch]
  );

  useEffect(() => {
    if (workspace && tagsLoading) {
      getTags();
      getTagCategories();
    }
  }, [workspace, getTags, getTagCategories, tagsLoading]);

  return {
    tags,
    tagCategories,
    tagsLoading,
    tagsError,
    tagsStats,

    getTags,
    addTag,
    updateTagById,
    deleteTagById,

    getTagCategories,
    addCategory,
    updateCategoryById,
    deleteCategoryById,
  };
};
