export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  color?: string;
  icon?: string;
}

export interface DepartmentFormData {
  name: string;
  description?: string;
  managerId?: string;
  parentId?: string;
  color?: string;
  icon?: string;
}

export interface DepartmentFilters {
  search?: string;
  parentId?: string;
}

export interface DepartmentTreeItem extends Department {
  children: DepartmentTreeItem[];
  level: number;
}
