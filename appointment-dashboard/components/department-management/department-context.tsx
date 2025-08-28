"use client";

import type React from "react";
import { createContext, useContext } from "react";
import { useDepartments } from "@/hooks/useDepartments";
import type {
  Department,
  DepartmentFormData,
  DepartmentFilters,
  DepartmentTreeItem,
} from "@/types/department";

interface DepartmentContextType {
  departments: Department[];
  departmentTree: DepartmentTreeItem[];
  flattenedTree: DepartmentTreeItem[];
  isLoading: boolean;
  error: string | null;
  filteredDepartments: Department[];
  filters: DepartmentFilters;
  setFilters: (filters: DepartmentFilters) => void;
  createDepartment: (data: DepartmentFormData) => Promise<Department>;
  updateDepartment: (
    id: string,
    data: DepartmentFormData
  ) => Promise<Department>;
  deleteDepartment: (id: string) => Promise<boolean>;
  getDepartmentById: (id: string) => Department | undefined;
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(
  undefined
);

export const DepartmentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const departmentsData = useDepartments();

  return (
    <DepartmentContext.Provider value={departmentsData}>
      {children}
    </DepartmentContext.Provider>
  );
};

export const useDepartmentContext = (): DepartmentContextType => {
  const context = useContext(DepartmentContext);

  if (context === undefined) {
    throw new Error(
      "useDepartmentContext must be used within a DepartmentProvider"
    );
  }

  return context;
};
