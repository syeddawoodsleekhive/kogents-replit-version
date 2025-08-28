"use client";

import { fetchTagCategories, fetchTags } from "@/api/tags";
import { clearUserData, removeToken } from "@/functions";
import Axios from "@/lib/axios";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";

// Define proper TypeScript interfaces
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Workspace {
  _id: string;
  name: string;
  slug: string;
}

interface CannedCategory {
  _id: string;
  id: string;
  name: string;
  description?: string;
  color: string;
}

interface CannedResponse {
  _id: string;
  id: string;
  title: string;
  content: string;
  categoryId: string;
  shortcut?: string;
  tags: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Tag {
  _id: string;
  name: string;
  color: string;
}

interface TagCategory {
  _id: string;
  name: string;
  description?: string;
}

type UserContextType = {
  user: User | null;
  workspace: Workspace | null;
  cannedCategory: CannedCategory[];
  cannedRes: CannedResponse[];
  tags: Tag[];
  tagCategories: TagCategory[];
  logout: () => void;
  getCannedResponses: () => void;
  getTags: () => void;
  getTagCategories: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [cannedCategory, setCannedCategory] = useState<CannedCategory[]>([]);
  const [cannedRes, setCannedRes] = useState<CannedResponse[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const slug = pathname.split("/")[1];

  const resetState = useCallback(() => {
    try {
      setUser(null);
      setWorkspace(null);
      setIsLoaded(false);
    } catch (error) {
      console.error("resetState error:", error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // await Axios.post("/auth/logout");
      removeToken();
      clearUserData();
      router.replace(`/${slug}/login`);
      setTimeout(() => {
        resetState();
      }, 500);
    } catch (error) {
      console.error("logout error:", error);
    }
  }, [router, slug, resetState]);

  const getCannedResponses = useCallback(() => {
    if (
      !(pathname.includes("/login") || pathname.includes("/onboarding")) &&
      workspace &&
      workspace?._id
    ) {
      // Fetch categories
      Axios.get(`/workspace/${workspace._id}/canned-responses/categories`)
        .then((res) => {
          const response = res.data;
          if (response?.data) {
            const data = response.data || [];
            setCannedCategory(
              data.map((d: any) => ({
                ...d,
                id: d._id,
              }))
            );
          }
        })
        .catch((err) => {
          console.error(err);
        });

      // Fetch responses
      Axios.get(`/workspace/${workspace._id}/canned-responses`)
        .then((res) => {
          const response = res.data;
          if (response?.data?.data) {
            const data = response.data.data || [];
            setCannedRes(data || []);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [pathname, workspace]);

  const getTags = useCallback(() => {
    if (workspace?._id) {
      fetchTags(workspace._id)
        .then((res) => {
          if (res?.data?.data) {
            setTags(res.data.data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch tags:", err);
        });
    }
  }, [workspace]);

  const getTagCategories = useCallback(() => {
    if (workspace?._id) {
      fetchTagCategories(workspace._id)
        .then((res) => {
          if (res?.data?.data) {
            setTagCategories(res.data.data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch tag categories:", err);
        });
    }
  }, [workspace]);

  // Load workspace data when workspace changes
  useEffect(() => {
    if (workspace) {
      getCannedResponses();
      getTags();
      getTagCategories();
    }
  }, [workspace, getCannedResponses, getTags, getTagCategories]);

  // Reset isLoaded when user changes
  useEffect(() => {
    if (isLoaded && !user) {
      setIsLoaded(false);
    }
  }, [user, isLoaded]);

  return (
    <UserContext.Provider
      value={{
        user,
        workspace,
        cannedCategory,
        cannedRes,
        tags,
        tagCategories,
        getTags,
        getTagCategories,
        getCannedResponses,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
