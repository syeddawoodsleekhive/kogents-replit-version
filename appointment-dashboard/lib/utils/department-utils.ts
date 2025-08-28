import type { Department, DepartmentTreeItem } from "@/types/department"

/**
 * Builds a hierarchical tree structure from flat department data
 */
export function buildDepartmentTree(
  departments: Department[],
  parentId: string | null = null,
  level = 0,
): DepartmentTreeItem[] {
  return departments
    .filter((dept) => (parentId === null && !dept.parentId) || dept.parentId === parentId)
    .map((dept) => ({
      ...dept,
      level,
      children: buildDepartmentTree(departments, dept.id, level + 1),
    }))
}

/**
 * Flattens a department tree back to an array with level information
 */
export function flattenDepartmentTree(
  tree: DepartmentTreeItem[],
  result: DepartmentTreeItem[] = [],
): DepartmentTreeItem[] {
  tree.forEach((node) => {
    result.push(node)
    if (node.children.length) {
      flattenDepartmentTree(node.children, result)
    }
  })
  return result
}

/**
 * Gets all descendant department IDs for a given department
 */
export function getDescendantDepartmentIds(departments: Department[], departmentId: string): string[] {
  const result: string[] = []

  // Find direct children
  const children = departments.filter((d) => d.parentId === departmentId)

  // Add each child and its descendants
  children.forEach((child) => {
    result.push(child.id)
    result.push(...getDescendantDepartmentIds(departments, child.id))
  })

  return result
}

/**
 * Gets the full department path as an array
 */
export function getDepartmentPath(departments: Department[], departmentId: string | undefined): Department[] {
  if (!departmentId) return []

  const result: Department[] = []
  let currentDept = departments.find((d) => d.id === departmentId)

  while (currentDept) {
    result.unshift(currentDept)
    currentDept = currentDept.parentId ? departments.find((d) => d.id === currentDept?.parentId) : undefined
  }

  return result
}

/**
 * Generates a formatted path string for a department
 */
export function formatDepartmentPath(departments: Department[], departmentId: string | undefined): string {
  if (!departmentId) return ""

  const path = getDepartmentPath(departments, departmentId)
  return path.map((d) => d.name).join(" > ")
}
