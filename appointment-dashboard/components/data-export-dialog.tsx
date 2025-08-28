"use client"

import type React from "react"

import { useState } from "react"
import { Calendar, Download, FileSpreadsheet, FileText, FileType2, Lock, LockKeyhole, Shield, Key } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EncryptionKeyManager } from "@/components/encryption-key-manager"
import { Switch } from "@/components/ui/switch"

interface DataExportDialogProps {
  dataType: "appointments" | "users" | "chats" | "emails" | "all"
  trigger?: React.ReactNode
  count?: number
  onExport?: (format: string, options: any) => void
}

// Add this utility function at the top of the file, after the imports
const downloadMockFile = (fileName: string, format: string, data: any) => {
  // Create mock content based on format
  let content = ""
  let mimeType = ""
  let fileExtension = ""

  switch (format) {
    case "csv":
      mimeType = "text/csv"
      fileExtension = "csv"
      // Create a simple CSV with headers and a few rows
      const headers = Object.keys(data[0] || {}).join(",")
      const rows = data.map((row: any) => Object.values(row).join(",")).join("\n")
      content = `${headers}\n${rows}`
      break
    case "excel":
      // For demo purposes, we'll just create a CSV but with .xlsx extension
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      fileExtension = "xlsx"
      const excelHeaders = Object.keys(data[0] || {}).join(",")
      const excelRows = data.map((row: any) => Object.values(row).join(",")).join("\n")
      content = `${excelHeaders}\n${excelRows}`
      break
    case "pdf":
      // For demo purposes, we'll create a text file with .pdf extension
      mimeType = "application/pdf"
      fileExtension = "pdf"
      content = "This is a mock PDF file. In a real application, this would be a properly formatted PDF document."
      break
    default:
      mimeType = "text/plain"
      fileExtension = "txt"
      content = JSON.stringify(data, null, 2)
  }

  // Create a blob with the content
  const blob = new Blob([content], { type: mimeType })

  // Create a URL for the blob
  const url = URL.createObjectURL(blob)

  // Create a link element
  const link = document.createElement("a")
  link.href = url
  link.download = fileName.endsWith(`.${fileExtension}`) ? fileName : `${fileName}.${fileExtension}`

  // Append the link to the body
  document.body.appendChild(link)

  // Click the link to trigger the download
  link.click()

  // Clean up
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Create mock data for different data types
const generateMockData = (dataType: string, fields: string[]) => {
  const mockData: Record<string, any>[] = []

  // Generate 10 rows of mock data
  for (let i = 0; i < 10; i++) {
    const row: Record<string, any> = {}

    fields.forEach((field) => {
      switch (field) {
        case "id":
          row[field] = `${dataType.slice(0, 3).toUpperCase()}-${1000 + i}`
          break
        case "customer":
        case "name":
          row[field] = `User ${i + 1}`
          break
        case "email":
          row[field] = `user${i + 1}@example.com`
          break
        case "phone":
          row[field] = `(555) ${100 + i}-${1000 + i}`
          break
        case "date":
          const date = new Date()
          date.setDate(date.getDate() + i)
          row[field] = date.toISOString().split("T")[0]
          break
        case "time":
          row[field] = `${9 + Math.floor(i / 2)}:${i % 2 === 0 ? "00" : "30"} AM`
          break
        case "status":
          const statuses = ["confirmed", "pending", "completed", "cancelled"]
          row[field] = statuses[i % statuses.length]
          break
        case "service":
          const services = [
            "Dental Checkup",
            "Tax Consultation",
            "Hair Styling",
            "Legal Consultation",
            "Therapy Session",
          ]
          row[field] = services[i % services.length]
          break
        default:
          row[field] = `${field} ${i + 1}`
      }
    })

    mockData.push(row)
  }

  return mockData
}

export function DataExportDialog({ dataType, trigger, count = 0, onExport }: DataExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState("csv")
  const [dateRange, setDateRange] = useState("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [fileName, setFileName] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  // Encryption options
  const [enableEncryption, setEnableEncryption] = useState(false)
  const [encryptionKeyId, setEncryptionKeyId] = useState<string | null>(null)
  const [encryptionPassword, setEncryptionPassword] = useState("")
  const [encryptionMethod, setEncryptionMethod] = useState("key")

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Set default filename based on data type and current date
      setFileName(
        `${dataType}_export_${format(new Date(), "yyyy-MM-dd")}.${exportFormat === "excel" ? "xlsx" : exportFormat}`,
      )
      setExportFormat("csv")
      setDateRange("all")
      setCustomStartDate("")
      setCustomEndDate("")
      setSelectedFields([])
      setIncludeHeaders(true)
      setIsExporting(false)
      setExportProgress(0)
      setEnableEncryption(false)
      setEncryptionPassword("")
    }
    setOpen(open)
  }

  // Get available fields based on data type
  const getAvailableFields = () => {
    switch (dataType) {
      case "appointments":
        return [
          { id: "id", label: "Appointment ID" },
          { id: "customer", label: "Customer Name" },
          { id: "email", label: "Email" },
          { id: "phone", label: "Phone" },
          { id: "service", label: "Service" },
          { id: "date", label: "Date" },
          { id: "time", label: "Time" },
          { id: "status", label: "Status" },
          { id: "source", label: "Source" },
          { id: "notes", label: "Notes" },
          { id: "emailStatus", label: "Email Status" },
        ]
      case "users":
        return [
          { id: "id", label: "User ID" },
          { id: "name", label: "Name" },
          { id: "email", label: "Email" },
          { id: "phone", label: "Phone" },
          { id: "appointments", label: "Appointments" },
          { id: "lastBooking", label: "Last Booking" },
          { id: "source", label: "Source" },
        ]
      case "chats":
        return [
          { id: "id", label: "Conversation ID" },
          { id: "appointmentId", label: "Appointment ID" },
          { id: "customer", label: "Customer" },
          { id: "date", label: "Date" },
          { id: "messages", label: "Messages" },
          { id: "source", label: "Source" },
        ]
      case "emails":
        return [
          { id: "id", label: "Email ID" },
          { id: "appointmentId", label: "Appointment ID" },
          { id: "customer", label: "Customer" },
          { id: "type", label: "Type" },
          { id: "status", label: "Status" },
          { id: "sentAt", label: "Sent At" },
          { id: "subject", label: "Subject" },
          { id: "content", label: "Content" },
        ]
      case "all":
        return [
          { id: "appointments", label: "Appointments" },
          { id: "users", label: "Users" },
          { id: "chats", label: "Chat Logs" },
          { id: "emails", label: "Email Logs" },
          { id: "settings", label: "System Settings" },
        ]
      default:
        return []
    }
  }

  const fields = getAvailableFields()

  // Toggle field selection
  const toggleField = (fieldId: string) => {
    if (selectedFields.includes(fieldId)) {
      setSelectedFields(selectedFields.filter((id) => id !== fieldId))
    } else {
      setSelectedFields([...selectedFields, fieldId])
    }
  }

  // Select all fields
  const selectAllFields = () => {
    setSelectedFields(fields.map((field) => field.id))
  }

  // Clear all selected fields
  const clearSelectedFields = () => {
    setSelectedFields([])
  }

  // Handle encryption key selection
  const handleSelectEncryptionKey = (keyId: string) => {
    setEncryptionKeyId(keyId)
  }

  // Handle export
  const handleExport = () => {
    // Validate form
    if (selectedFields.length === 0) {
      toast({
        title: "No fields selected",
        description: "Please select at least one field to export.",
        variant: "destructive",
      })
      return
    }

    if (dateRange === "custom" && (!customStartDate || !customEndDate)) {
      toast({
        title: "Invalid date range",
        description: "Please select both start and end dates for custom date range.",
        variant: "destructive",
      })
      return
    }

    // Validate encryption options
    if (enableEncryption) {
      if (encryptionMethod === "password" && !encryptionPassword) {
        toast({
          title: "Encryption Password Required",
          description: "Please enter a password for encrypting the export file.",
          variant: "destructive",
        })
        return
      }

      if (encryptionMethod === "key" && !encryptionKeyId) {
        toast({
          title: "Encryption Key Required",
          description: "Please select an encryption key for encrypting the export file.",
          variant: "destructive",
        })
        return
      }
    }

    // Start export process
    setIsExporting(true)
    setExportProgress(0)

    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        const newProgress = prev + Math.random() * 20
        if (newProgress >= 100) {
          clearInterval(interval)

          // Simulate export completion
          setTimeout(() => {
            // Generate mock data based on selected fields
            const mockData = generateMockData(dataType, selectedFields)

            // Trigger file download
            downloadMockFile(fileName, exportFormat, mockData)

            setIsExporting(false)
            setOpen(false)

            toast({
              title: "Export Successful",
              description: `${dataType} data has been exported as ${fileName}${enableEncryption ? " (Encrypted)" : ""}`,
            })

            // Call onExport callback if provided
            if (onExport) {
              onExport(exportFormat, {
                dateRange,
                customStartDate,
                customEndDate,
                selectedFields,
                includeHeaders,
                fileName,
                encryption: enableEncryption
                  ? {
                      method: encryptionMethod,
                      keyId: encryptionKeyId,
                      password: encryptionPassword,
                    }
                  : null,
              })
            }
          }, 500)

          return 100
        }
        return newProgress
      })
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export {dataType.charAt(0).toUpperCase() + dataType.slice(1)} Data</DialogTitle>
          <DialogDescription>
            Export your data in various formats for backup or analysis.
            {count > 0 && (
              <Badge variant="outline" className="ml-2">
                {count} records
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {isExporting ? (
          <div className="py-6 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium">Exporting Data...</h3>
              <p className="text-sm text-muted-foreground">Please wait while your data is being prepared.</p>
              {enableEncryption && (
                <Badge className="mt-2 bg-primary">
                  <Shield className="mr-1 h-3 w-3" /> Encrypted
                </Badge>
              )}
            </div>
            <Progress value={exportProgress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              {exportProgress < 100 ? "Processing..." : "Finalizing export..."}
            </p>
          </div>
        ) : (
          <Tabs defaultValue="format" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="format">Format</TabsTrigger>
              <TabsTrigger value="data">Data Selection</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
            </TabsList>

            <TabsContent value="format" className="space-y-4">
              <div className="space-y-2">
                <Label>Export Format</Label>
                <RadioGroup value={exportFormat} onValueChange={setExportFormat} className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv" className="flex items-center cursor-pointer">
                      <FileText className="mr-2 h-4 w-4 text-green-600" />
                      CSV (Comma Separated Values)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excel" id="excel" />
                    <Label htmlFor="excel" className="flex items-center cursor-pointer">
                      <FileSpreadsheet className="mr-2 h-4 w-4 text-blue-600" />
                      Excel Spreadsheet
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf" className="flex items-center cursor-pointer">
                      <FileType2 className="mr-2 h-4 w-4 text-red-600" />
                      PDF Document
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <RadioGroup value={dateRange} onValueChange={setDateRange} className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="cursor-pointer">
                      All Time
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="today" id="today" />
                    <Label htmlFor="today" className="cursor-pointer">
                      Today
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="week" id="week" />
                    <Label htmlFor="week" className="cursor-pointer">
                      This Week
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="month" id="month" />
                    <Label htmlFor="month" className="cursor-pointer">
                      This Month
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="cursor-pointer">
                      Custom Range
                    </Label>
                  </div>

                  {dateRange === "custom" && (
                    <div className="grid grid-cols-2 gap-2 pl-6 mt-2">
                      <div className="space-y-1">
                        <Label htmlFor="start-date" className="text-sm">
                          Start Date
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="start-date"
                            type="date"
                            className="pl-8"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="end-date" className="text-sm">
                          End Date
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="end-date"
                            type="date"
                            className="pl-8"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </RadioGroup>
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Select Fields to Export</Label>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={selectAllFields}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelectedFields}>
                    Clear
                  </Button>
                </div>
              </div>

              <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {fields.map((field) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.id}
                        checked={selectedFields.includes(field.id)}
                        onCheckedChange={() => toggleField(field.id)}
                      />
                      <Label htmlFor={field.id} className="cursor-pointer">
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-headers"
                  checked={includeHeaders}
                  onCheckedChange={(checked) => setIncludeHeaders(checked as boolean)}
                />
                <Label htmlFor="include-headers" className="cursor-pointer">
                  Include column headers
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-encryption">Enable Encryption</Label>
                  <p className="text-sm text-muted-foreground">Encrypt exported data for enhanced security</p>
                </div>
                <Switch id="enable-encryption" checked={enableEncryption} onCheckedChange={setEnableEncryption} />
              </div>

              {enableEncryption && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Encryption Method</Label>
                    <RadioGroup
                      value={encryptionMethod}
                      onValueChange={setEncryptionMethod}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="key" id="key-method" />
                        <Label htmlFor="key-method" className="flex items-center cursor-pointer">
                          <Key className="mr-2 h-4 w-4 text-primary" />
                          Use Encryption Key
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="password" id="password-method" />
                        <Label htmlFor="password-method" className="flex items-center cursor-pointer">
                          <LockKeyhole className="mr-2 h-4 w-4 text-primary" />
                          Use Password
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {encryptionMethod === "key" ? (
                    <div className="space-y-2">
                      <Label>Select Encryption Key</Label>
                      <div className="mt-2">
                        <EncryptionKeyManager onSelectKey={handleSelectEncryptionKey} />
                      </div>
                      {encryptionKeyId && (
                        <div className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded-md text-sm">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 text-primary mr-2" />
                            <span>Encryption key selected</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="encryption-password">Encryption Password</Label>
                      <Input
                        id="encryption-password"
                        type="password"
                        placeholder="Enter a strong password"
                        value={encryptionPassword}
                        onChange={(e) => setEncryptionPassword(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use a strong, unique password that you can remember. You'll need this password to decrypt the
                        file later.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Encryption Strength</Label>
                    <Select defaultValue="aes-256">
                      <SelectTrigger>
                        <SelectValue placeholder="Select encryption strength" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aes-256">AES-256 (Recommended)</SelectItem>
                        <SelectItem value="aes-192">AES-192</SelectItem>
                        <SelectItem value="aes-128">AES-128</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                    <p className="font-medium">Important Security Notice</p>
                    <p className="mt-1">
                      {encryptionMethod === "key"
                        ? "Make sure you have access to this encryption key when you need to decrypt this file. If you lose access to the key, you won't be able to recover the data."
                        : "Store this password in a secure location. If you forget this password, you will not be able to decrypt the file."}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="options" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-name">File Name</Label>
                <Input
                  id="file-name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter file name"
                />
              </div>

              {exportFormat === "csv" && (
                <div className="space-y-2">
                  <Label htmlFor="delimiter">Delimiter</Label>
                  <Select defaultValue="comma">
                    <SelectTrigger id="delimiter">
                      <SelectValue placeholder="Select delimiter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comma">Comma (,)</SelectItem>
                      <SelectItem value="semicolon">Semicolon (;)</SelectItem>
                      <SelectItem value="tab">Tab</SelectItem>
                      <SelectItem value="pipe">Pipe (|)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {exportFormat === "excel" && (
                <div className="space-y-2">
                  <Label htmlFor="sheet-name">Sheet Name</Label>
                  <Input
                    id="sheet-name"
                    defaultValue={dataType.charAt(0).toUpperCase() + dataType.slice(1)}
                    placeholder="Enter sheet name"
                  />
                </div>
              )}

              {exportFormat === "pdf" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="page-size">Page Size</Label>
                    <Select defaultValue="a4">
                      <SelectTrigger id="page-size">
                        <SelectValue placeholder="Select page size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="letter">Letter</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orientation">Orientation</Label>
                    <Select defaultValue="portrait">
                      <SelectTrigger id="orientation">
                        <SelectValue placeholder="Select orientation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          {!isExporting && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport}>
                {enableEncryption ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Export Encrypted
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
