import Axios from "@/lib/axios";
import { socket } from "@/lib/socket";

export interface TagCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
  workspace: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  categoryId: string;
  description?: string;
  workspace: string;
  createdAt?: string;
  updatedAt?: string;
  usageCount?: number;
}

export const createTagCategory = (
  data: Omit<TagCategory, "id" | "createdAt" | "updatedAt">
) => Axios.post("/tag-categories", data);

export const fetchTagCategories = (workspace: string) =>
  Axios.get("/tag-categories", { params: { workspace } });

export const fetchTagCategoryById = (id: string) =>
  Axios.get(`/tag-categories/${id}`);

export const updateTagCategory = (
  id: string,
  data: Partial<Omit<TagCategory, "id" | "createdAt" | "updatedAt">>
) => Axios.put(`/tag-categories/${id}`, data);

export const deleteTagCategory = (id: string) =>
  Axios.delete<void>(`/tag-categories/${id}`);

export const createTag = (
  data: Omit<Partial<Tag>, "id" | "createdAt" | "updatedAt" | "usageCount">
) => Axios.post("/tags", data);

export const fetchTags = (workspace: string) =>
  Axios.get("/tags", { params: { workspace } });

export const fetchTagById = (id: string) => Axios.get<Tag>(`/tags/${id}`);

export const updateTag = (
  id: string,
  data: Partial<Omit<Tag, "id" | "createdAt" | "updatedAt" | "usageCount">>
) => Axios.put(`/tags/${id}`, data);

export const deleteTag = (id: string | null) =>
  Axios.delete<void>(`/tags/${id}`);

export const addTagsToSession = async ({
  tags,
  roomId,
}: {
  tags: string[];
  roomId: string;
}) => {
  try {
    const payload = {
      tags,
      sessionId: roomId,
    };
    socket.emit("AddTagToSession", payload);
  } catch (err) {
    console.error("Error saving chat socket:", err);
  }
};

export const removeTagsFromSession = async ({
  tags,
  roomId,
}: {
  tags: string[];
  roomId: string;
}) => {
  try {
    const payload = {
      tags,
      sessionId: roomId,
    };
    socket.emit("RemoveTagFromSession", payload);
  } catch (err) {
    console.error("Error saving chat socket:", err);
  }
};
