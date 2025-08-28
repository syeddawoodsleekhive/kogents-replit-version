"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type {
  User,
  UserFormData,
  UserFilters,
  Permission,
  UserRole,
  CreateUserResponse,
  CreateUserPermission,
  UserStatus,
} from "./types";
import Axios from "@/lib/axios";
import { useUser } from "@/context/UserContext";
import { IGetAllUsersResponse, IUser } from "@/types/user";
import { usePathname } from "next/navigation";

interface UserContextType {
  users: User[];
  currentUser: CreateUserResponse | null;
  isLoading: boolean;
  error: string | null;
  filteredUsers: User[];
  filters: UserFilters;
  setFilters: (filters: UserFilters) => void;
  createUser: (userData: UserFormData) => Promise<User>;
  updateUser: (id: string, userData: UserFormData) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  getUserById: (id: string) => User | undefined;
  hasPermission: (permission: Permission) => boolean;
  updateCurrentUser: (userData: UserFormData) => Promise<boolean>;
  getUserDataById: (id: string) => Promise<CreateUserResponse | undefined>;
  userData: CreateUserResponse | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CreateUserResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>({});
  const [userData, setUserData] = useState<CreateUserResponse | null>(null);

  const { workspace, user } = useUser();
  const workspaceId = workspace?._id;
  const pathname = usePathname();

  // Simulate fetching users from an API
  const fetchUsers = useCallback(async () => {
    // if (workspaceId) {
    try {
      Axios.get(`/users`).then((res) => {
        const response: IGetAllUsersResponse = res.data;
        console.log("response", response);

        if (response) {
          const userArr: User[] = response?.users?.map((user: IUser) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role.name as UserRole,
            phone: user.phone || undefined,
            status: user.status as UserStatus,
            createdAt: "",
            lastActive: "",
            jobTitle:
              user.role.name === "admin" ? "System Administrator" : "Agent",
            bio: user.role.name === "admin" ? "System Administrator" : "Agent",
            permissions: user.permissions.map(
              (p: any) => p.name
            ) as Permission[],
          }));

          const allUserArr = userArr.filter((user) => user.role !== "admin");
          // setCurrentUser(user);
          setIsLoading(false);
          setUsers(allUserArr);
        }
      });
    } catch (err) {
      setError("Failed to fetch users");
      setIsLoading(false);
    }
    // }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await Axios.get(`/users/profile`);
      const response = res.data;
      if (response) {
        setCurrentUser(response);
      }
    } catch (error) {
      console.log("error", error);
    }
  }, [user]);

  const getUserDataById = useCallback(
    async (id: string): Promise<CreateUserResponse | undefined> => {
      setIsLoading(true);
      return Axios.get(`/users/${id}`)
        .then((res) => {
          const response = res.data;
          setUserData(response);
          return response;
        })
        .catch((err) => {
          console.log("err", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    []
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (pathname.includes("profile")) {
      fetchCurrentUser();
    }
  }, [pathname]);

  // Filter users based on the current filters
  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (filters.role)
      result = result.filter((user) => user.role === filters.role);
    if (filters.status)
      result = result.filter((user) => user.status === filters.status);
    if (filters.department)
      result = result.filter((user) => user.department === filters.department);
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.phone && user.phone.includes(filters.search!))
      );
    }
    return result;
  }, [users, filters]);

  // Ensure createUser function is properly implemented
  const createUser = useCallback(
    async (userData: UserFormData): Promise<User> => {
      setIsLoading(true);
      setError(null);
      try {
        const userPayload = {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role_name: userData.role,
          status: userData.status,
          phone: userData.phone,
        };
        const res = await Axios.post("/users", userPayload);
        const response: CreateUserResponse = res.data;
        if (response) {
          const newUser: User = {
            id: response.id,
            permissions: response.permissions.map(
              (p: CreateUserPermission) => p.name
            ) as Permission[],
            ...userData,
            createdAt: new Date().toISOString(),
          };
          setUsers((prevUsers) => [newUser, ...prevUsers]);
          return newUser;
        }
        throw new Error("No response from server");
      } catch (err) {
        setError("Failed to create user");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateUser = useCallback(
    async (id: string, userData: UserFormData): Promise<boolean> => {
      try {
        setIsLoading(true);
        const updateUserPayload = {
          name: userData.name,
          email: userData.email,
          ...(userData.password ? { password: userData.password } : {}),
          phone: userData.phone,
          role_name: userData.role,
        };

        await Axios.put(`/users/${id}`, updateUserPayload)
          .then((res) => {
            const response = res.data;
            if (response) {
              getUserDataById(id);
              fetchUsers();
            }
          })
          .catch((err) => {
            console.error(err);
          });
        return true;
      } catch (err) {
        setError("Failed to update user");
        setIsLoading(false);
        throw new Error("Failed to update user");
      }
    },
    []
  );

  const updateCurrentUser = useCallback(
    async (userData: UserFormData): Promise<boolean> => {
      try {
        setIsLoading(true);
        const currentUserPayload = {
          name: userData.name,
          email: userData.email,
          ...(userData.password ? { password: userData.password } : {}),
          phone: userData.phone,
        };

        await Axios.put(`/users/profile`, currentUserPayload)
          .then((res) => {
            const response = res.data;
            if (response) {
              fetchCurrentUser();
            }
          })
          .catch((err) => {
            console.error(err);
          });
        return true;
      } catch (err) {
        setError("Failed to update user");
        throw new Error("Failed to update user");
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
  );

  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await Axios.delete(`/users/${id}`);
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
      return true;
    } catch (err) {
      setError("Failed to delete user");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserById = useCallback(
    (id: string): User | undefined => users.find((user) => user.id === id),
    [users]
  );

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!currentUser) return false;
      return true;
      // return currentUser.permissions.includes(permission);
    },
    [currentUser]
  );

  const value = useMemo(
    () => ({
      users,
      currentUser,
      isLoading,
      error,
      filteredUsers,
      filters,
      setFilters,
      createUser,
      updateUser,
      deleteUser,
      getUserById,
      hasPermission,
      updateCurrentUser,
      getUserDataById,
      userData,
    }),
    [
      users,
      currentUser,
      isLoading,
      error,
      filteredUsers,
      filters,
      setFilters,
      createUser,
      updateUser,
      deleteUser,
      getUserById,
      hasPermission,
      updateCurrentUser,
      getUserDataById,
      userData,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUsers = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within a UserProvider");
  }
  return context;
};
