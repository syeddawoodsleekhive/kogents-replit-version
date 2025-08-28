"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { Department, DepartmentFormData, DepartmentFilters, DepartmentTreeItem } from "@/types/department"
import { buildDepartmentTree, flattenDepartmentTree } from "@/lib/utils/department-utils"
import { mockDepartments } from "@/components/department-management/mock-data"

interface UseDepartmentsReturn {
  departments: Department[]
  departmentTree: DepartmentTreeItem[]
  flattenedTree: DepartmentTreeItem[]
  isLoading: boolean
  error: string | null
  filteredDepartments: Department[]
  filters: DepartmentFilters
  setFilters: (filters: DepartmentFilters) => void
  createDepartment: (data: DepartmentFormData) => Promise<Department>
  updateDepartment: (id: string, data: DepartmentFormData) => Promise<Department>
  deleteDepartment: (id: string) => Promise<boolean>
  getDepartmentById: (id: string) => Department | undefined
}

export function useDepartments(): UseDepartmentsReturn {
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<DepartmentFilters>({})

  // Fetch departments (simulated)
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))
        setDepartments(mockDepartments)
        setIsLoading(false)
      } catch (err) {
        setError("Failed to fetch departments")
        setIsLoading(false)
      }
    }

    fetchDepartments()
  }, [])

  // Build department tree
  const departmentTree = useMemo(() => {
    return buildDepartmentTree(departments)
  }, [departments])

  // Flatten tree for display with hierarchy information
  const flattenedTree = useMemo(() => {
    return flattenDepartmentTree(departmentTree)
  }, [departmentTree])

  // Filter departments based on search and parent
  const filteredDepartments = useMemo(() => {
    let result = [...departments]

    if (filters.parentId) {
      result = result.filter((dept) => dept.parentId === filters.parentId)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (dept) =>
          dept.name.toLowerCase().includes(searchLower) ||
          (dept.description && dept.description.toLowerCase().includes(searchLower)),
      )
    }

    return result
  }, [departments, filters])

  // Create a new department
  const createDepartment = useCallback(async (data: DepartmentFormData): Promise<Department> => {
    try {
      setIsLoading(true)
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      const newDepartment: Department = {
        id: `dept_${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(3, "0")}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        memberCount: 0,
      }

      setDepartments((prevDepartments) => [...prevDepartments, newDepartment])
      setIsLoading(false)
      return newDepartment
    } catch (err) {
      setError("Failed to create department")
      setIsLoading(false)
      throw new Error("Failed to create department")
    }
  }, [])

  // Update an existing department
  const updateDepartment = useCallback(
    async (id: string, data: DepartmentFormData): Promise<Department> => {
      try {
        setIsLoading(true)
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        const updatedDepartment: Department = {
          ...departments.find((dept) => dept.id === id)!,
          ...data,
          updatedAt: new Date().toISOString(),
        }

        setDepartments((prevDepartments) => prevDepartments.map((dept) => (dept.id === id ? updatedDepartment : dept)))

        setIsLoading(false)
        return updatedDepartment
      } catch (err) {
        setError("Failed to update department")
        setIsLoading(false)
        throw new Error("Failed to update department")
      }
    },
    [departments],
  )

  // Delete a department
  const deleteDepartment = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      setDepartments((prevDepartments) => prevDepartments.filter((dept) => dept.id !== id))
      setIsLoading(false)
      return true
    } catch (err) {
      setError("Failed to delete department")
      setIsLoading(false)
      throw new Error("Failed to delete department")
    }
  }, [])

  // Get department by ID
  const getDepartmentById = useCallback(
    (id: string): Department | undefined => {
      return departments.find((dept) => dept.id === id)
    },
    [departments],
  )

  return {
    departments,
    departmentTree,
    flattenedTree,
    isLoading,
    error,
    filteredDepartments,
    filters,
    setFilters,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentById,
  }
}
