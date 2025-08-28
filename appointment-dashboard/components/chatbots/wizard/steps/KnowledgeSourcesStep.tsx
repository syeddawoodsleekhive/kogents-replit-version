"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Link, Type, X, Plus, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatbotWizardData } from "@/types/chatbots/wizard"

interface KnowledgeSourcesStepProps {
  data: ChatbotWizardData
  onUpdate: (updates: Partial<ChatbotWizardData>) => void
  errors: string[]
}

// File upload component
const FileUploadSection = ({
  files,
  onFilesChange,
  onFileRemove,
}: {
  files: File[]
  onFilesChange: (files: File[]) => void
  onFileRemove: (index: number) => void
}) => {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      const validFiles = droppedFiles.filter(
        (file) =>
          file.type === "text/plain" ||
          file.type === "application/pdf" ||
          file.type === "text/csv" ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".docx"),
      )

      if (validFiles.length > 0) {
        onFilesChange([...files, ...validFiles])
      }
    },
    [files, onFilesChange],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      if (selectedFiles.length > 0) {
        onFilesChange([...files, ...selectedFiles])
      }
      // Reset input value to allow selecting the same file again
      e.target.value = ""
    },
    [files, onFilesChange],
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "pdf":
        return <FileText className="w-4 h-4 text-red-500" />
      case "txt":
      case "md":
        return <FileText className="w-4 h-4 text-blue-500" />
      case "csv":
        return <FileText className="w-4 h-4 text-green-500" />
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 relative cursor-pointer",
          dragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/20",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload
          className={cn(
            "w-12 h-12 mx-auto mb-4 transition-colors",
            dragActive ? "text-primary" : "text-muted-foreground",
          )}
        />
        <div className="space-y-2">
          <p className="text-lg font-medium">{dragActive ? "Drop files here" : "Drop files here or click to upload"}</p>
          <p className="text-sm text-muted-foreground">
            Supports PDF, TXT, CSV, Markdown, and DOCX files (max 10MB each)
          </p>
        </div>
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.csv,.md,.docx"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Uploaded Files ({files.length})</Label>
            <Badge variant="secondary" className="text-xs">
              {files.reduce((acc, file) => acc + file.size, 0) > 1024 * 1024
                ? `${(files.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)).toFixed(1)} MB`
                : `${Math.round(files.reduce((acc, file) => acc + file.size, 0) / 1024)} KB`}
            </Badge>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(file.name)}
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFileRemove(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// URL management component
const URLManagementSection = ({
  urls,
  onUrlsChange,
}: {
  urls: string[]
  onUrlsChange: (urls: string[]) => void
}) => {
  const [newUrl, setNewUrl] = useState("")
  const [urlError, setUrlError] = useState("")

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const addUrl = useCallback(() => {
    const trimmedUrl = newUrl.trim()

    if (!trimmedUrl) {
      setUrlError("Please enter a URL")
      return
    }

    if (!validateUrl(trimmedUrl)) {
      setUrlError("Please enter a valid URL (e.g., https://example.com)")
      return
    }

    if (urls.includes(trimmedUrl)) {
      setUrlError("This URL has already been added")
      return
    }

    onUrlsChange([...urls, trimmedUrl])
    setNewUrl("")
    setUrlError("")
  }, [newUrl, urls, onUrlsChange])

  const removeUrl = useCallback(
    (index: number) => {
      const newUrls = urls.filter((_, i) => i !== index)
      onUrlsChange(newUrls)
    },
    [urls, onUrlsChange],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUrl(e.target.value)
    if (urlError) setUrlError("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addUrl()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="https://example.com/help"
              value={newUrl}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={cn(urlError && "border-red-500 focus-visible:ring-red-500")}
            />
            {urlError && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {urlError}
              </p>
            )}
          </div>
          <Button onClick={addUrl} disabled={!newUrl.trim()} className="flex-shrink-0">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {urls.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Added URLs ({urls.length})</Label>
            <Badge variant="secondary" className="text-xs">
              {urls.length} {urls.length === 1 ? "source" : "sources"}
            </Badge>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {urls.map((url, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3 min-w-0">
                  <Link className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm truncate block">{url}</span>
                    <span className="text-xs text-muted-foreground">
                      {validateUrl(url) ? "Valid URL" : "Invalid URL"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUrl(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Link className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No URLs added yet</p>
          <p className="text-sm">Add website URLs for your chatbot to learn from</p>
        </div>
      )}
    </div>
  )
}

// Text content component
const TextContentSection = ({
  textContent,
  onTextChange,
}: {
  textContent: string
  onTextChange: (text: string) => void
}) => {
  const wordCount = useMemo(() => {
    return textContent
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }, [textContent])

  const characterCount = textContent.length

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="text-content" className="text-sm font-medium">
          Content
        </Label>
        <Textarea
          id="text-content"
          placeholder="Paste your content here... This could be FAQs, product information, policies, or any other text you want your chatbot to know about."
          value={textContent}
          onChange={(e) => onTextChange(e.target.value)}
          className="min-h-[200px] resize-none"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{characterCount} characters</span>
          <span>{wordCount} words</span>
        </div>
      </div>

      {textContent.trim().length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Content Preview</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {textContent.slice(0, 200)}
            {textContent.length > 200 && "..."}
          </p>
        </div>
      )}
    </div>
  )
}

// Main component
export function KnowledgeSourcesStep({ data, onUpdate, errors }: KnowledgeSourcesStepProps) {
  const [activeTab, setActiveTab] = useState("files")

  const handleFilesChange = useCallback(
    (files: File[]) => {
      onUpdate({
        knowledgeSources: {
          ...data.knowledgeSources,
          files,
        },
      })
    },
    [data.knowledgeSources, onUpdate],
  )

  const handleFileRemove = useCallback(
    (index: number) => {
      const newFiles = data.knowledgeSources.files.filter((_, i) => i !== index)
      handleFilesChange(newFiles)
    },
    [data.knowledgeSources.files, handleFilesChange],
  )

  const handleUrlsChange = useCallback(
    (urls: string[]) => {
      onUpdate({
        knowledgeSources: {
          ...data.knowledgeSources,
          urls,
        },
      })
    },
    [data.knowledgeSources, onUpdate],
  )

  const handleTextChange = useCallback(
    (textContent: string) => {
      onUpdate({
        knowledgeSources: {
          ...data.knowledgeSources,
          textContent,
        },
      })
    },
    [data.knowledgeSources, onUpdate],
  )

  const knowledgeSourcesCount = useMemo(() => {
    const filesCount = data.knowledgeSources.files.length
    const urlsCount = data.knowledgeSources.urls.length
    const hasText = data.knowledgeSources.textContent.trim().length > 0 ? 1 : 0
    return filesCount + urlsCount + hasText
  }, [data.knowledgeSources])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Knowledge Sources</h2>
        <p className="text-muted-foreground">Upload documents, add URLs, or paste text to train your chatbot.</p>
        {knowledgeSourcesCount > 0 && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {knowledgeSourcesCount} knowledge {knowledgeSourcesCount === 1 ? "source" : "sources"} added
            </Badge>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="files" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Files
            {data.knowledgeSources.files.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {data.knowledgeSources.files.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="urls" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            URLs
            {data.knowledgeSources.urls.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {data.knowledgeSources.urls.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Text
            {data.knowledgeSources.textContent.trim().length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                ✓
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                File Upload
              </CardTitle>
              <CardDescription>Upload PDF, TXT, CSV, Markdown, or DOCX files to train your chatbot</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadSection
                files={data.knowledgeSources.files}
                onFilesChange={handleFilesChange}
                onFileRemove={handleFileRemove}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="urls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                Website URLs
              </CardTitle>
              <CardDescription>Add website URLs for your chatbot to learn from</CardDescription>
            </CardHeader>
            <CardContent>
              <URLManagementSection urls={data.knowledgeSources.urls} onUrlsChange={handleUrlsChange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Text Content
              </CardTitle>
              <CardDescription>Paste or type content directly for your chatbot to learn from</CardDescription>
            </CardHeader>
            <CardContent>
              <TextContentSection textContent={data.knowledgeSources.textContent} onTextChange={handleTextChange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4" />
              <div className="font-medium">Please fix the following issues:</div>
            </div>
            <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
