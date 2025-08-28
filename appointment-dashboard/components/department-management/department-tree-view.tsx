"use client"

import { useState, useEffect } from "react"
import { useDepartmentContext } from "./department-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EditDepartmentDialog } from "./edit-department-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, ChevronDown, Pencil, Trash2, FolderTree } from "lucide-react"
import type { DepartmentTreeItem } from "@/types/department"

interface DepartmentTreeViewProps {
  searchQuery?: string
}

export function DepartmentTreeView({ searchQuery = "" }: DepartmentTreeViewProps) {
  const { departmentTree, flattenedTree, isLoading, deleteDepartment } = useDepartmentContext()
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set())
  const [filteredTree, setFilteredTree] = useState<DepartmentTreeItem[]>([])
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter departments based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTree(departmentTree)
      return
    }

    const query = searchQuery.toLowerCase()

    // Find matching departments
    const matchingDeptIds = new Set(
      flattenedTree
        .filter((dept) => dept.name.toLowerCase().includes(query) || dept.description?.toLowerCase().includes(query))
        .map((dept) => dept.id),
    )

    // If we have matches, expand all parent departments
    if (matchingDeptIds.size > 0) {
      const parentsToExpand = new Set<string>()

      // For each matching department, add all its ancestors to the set
      flattenedTree.forEach((dept) => {
        if (matchingDeptIds.has(dept.id)) {
          // Find all ancestors and add them to the set
          let currentDept = dept
          while (currentDept.parentId) {
            parentsToExpand.add(currentDept.parentId)
            const parent = flattenedTree.find((d) => d.id === currentDept.parentId)
            if (!parent) break
            currentDept = parent
          }
        }
      })

      // Update expanded departments
      setExpandedDepartments(new Set([...expandedDepartments, ...parentsToExpand]))
    }

    // Use the original tree but highlight matches
    setFilteredTree(departmentTree)
  }, [departmentTree, flattenedTree, searchQuery])

  const toggleDepartment = (deptId: string) => {
    const newExpanded = new Set(expandedDepartments)
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId)
    } else {
      newExpanded.add(deptId)
    }
    setExpandedDepartments(newExpanded)
  }

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return

    setIsDeleting(true)
    try {
      await deleteDepartment(departmentToDelete)
    } catch (error) {
      console.error("Error deleting department:", error)
    } finally {
      setIsDeleting(false)
      setDepartmentToDelete(null)
    }
  }

  // Recursive function to render the department tree
  const renderDepartmentTree = (departments: DepartmentTreeItem[], level = 0) => {
    return departments.map((department) => {
      const isExpanded = expandedDepartments.has(department.id)
      const isMatch =
        searchQuery &&
        (department.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          department.description?.toLowerCase().includes(searchQuery.toLowerCase()))

      return (
        <div key={department.id} className="department-tree-item">
          <div
            className={`
              flex items-center p-2 rounded-md
              ${level > 0 ? "ml-6" : ""}
              ${isMatch ? "bg-muted" : "hover:bg-muted/50"}
            `}
          >
            {department.children.length > 0 ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 mr-1"
                onClick={() => toggleDepartment(department.id)}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
              <div className="w-7"></div>
            )}

            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: department.color || "#6366f1" }} />

            <div className="flex-1 font-medium">{department.name}</div>

            <Badge variant="outline" className="mr-2 font-normal">
              {department.memberCount} {department.memberCount === 1 ? "member" : "members"}
            </Badge>

            <div className="flex items-center">
              <EditDepartmentDialog departmentId={department.id}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit {department.name}</span>
                </Button>
              </EditDepartmentDialog>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDepartmentToDelete(department.id)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete {department.name}</span>
              </Button>
            </div>
          </div>

          {isExpanded && department.children.length > 0 && (
            <div className="department-children">{renderDepartmentTree(department.children, level + 1)}</div>
          )}
        </div>
      )
    })
  }

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4 ml-6" />
            <Skeleton className="h-8 w-2/3 ml-12" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-4/5 ml-6" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render empty state
  if (filteredTree.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted p-3">
            <FolderTree className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No departments found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery ? "Try adjusting your search query" : "Get started by creating your first department"}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="department-tree">{renderDepartmentTree(filteredTree)}</div>
        </CardContent>
      </Card>

      <AlertDialog open={!!departmentToDelete} onOpenChange={(open) => !open && setDepartmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the department and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDepartment}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
