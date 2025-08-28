"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Check,
  Clock,
  Cloud,
  Database,
  HardDrive,
  Key,
  Lock,
  MoreHorizontal,
  RefreshCw,
  Save,
  Shield,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EncryptionKeyManager } from "@/components/encryption-key-manager"

// Mock backup history data
const backupHistory = [
  {
    id: "backup-001",
    timestamp: "2025-05-06T02:00:00",
    status: "completed",
    size: "42.8 MB",
    location: "Cloud Storage (AWS S3)",
    duration: "2m 12s",
    type: "automatic",
    encrypted: true,
  },
  {
    id: "backup-002",
    timestamp: "2025-05-05T02:00:00",
    status: "completed",
    size: "41.5 MB",
    location: "Cloud Storage (AWS S3)",
    duration: "1m 58s",
    type: "automatic",
    encrypted: true,
  },
  {
    id: "backup-003",
    timestamp: "2025-05-04T02:00:00",
    status: "completed",
    size: "40.9 MB",
    location: "Cloud Storage (AWS S3)",
    duration: "2m 05s",
    type: "automatic",
    encrypted: true,
  },
  {
    id: "backup-004",
    timestamp: "2025-05-03T14:22:00",
    status: "completed",
    size: "40.7 MB",
    location: "Local Storage",
    duration: "1m 45s",
    type: "manual",
    encrypted: false,
  },
  {
    id: "backup-005",
    timestamp: "2025-05-03T02:00:00",
    status: "failed",
    size: "0 MB",
    location: "Cloud Storage (AWS S3)",
    duration: "0m 32s",
    type: "automatic",
    error: "Connection timeout",
    encrypted: true,
  },
  {
    id: "backup-006",
    timestamp: "2025-05-02T02:00:00",
    status: "completed",
    size: "39.2 MB",
    location: "Cloud Storage (AWS S3)",
    duration: "1m 52s",
    type: "automatic",
    encrypted: true,
  },
]

// Add this utility function at the top of the file, after the imports
const downloadMockBackupFile = (backupId: string, encrypted: boolean) => {
  // Create mock backup content
  const mockBackupData = {
    id: backupId,
    timestamp: new Date().toISOString(),
    encrypted: encrypted,
    data: {
      appointments: [
        { id: "APT-1001", customer: "Sarah Johnson", service: "Dental Checkup", date: "2025-05-07" },
        { id: "APT-1002", customer: "Michael Chen", service: "Tax Consultation", date: "2025-05-07" },
        { id: "APT-1003", customer: "Emma Wilson", service: "Hair Styling", date: "2025-05-07" },
      ],
      users: [
        { id: "USR-1001", name: "Sarah Johnson", email: "sarah.j@example.com" },
        { id: "USR-1002", name: "Michael Chen", email: "m.chen@example.com" },
        { id: "USR-1003", name: "Emma Wilson", email: "emma.w@example.com" },
      ],
      // Add more mock data as needed
    },
  }

  // Convert to JSON string
  const content = JSON.stringify(mockBackupData, null, 2)

  // Create a blob with the content
  const blob = new Blob([content], { type: "application/json" })

  // Create a URL for the blob
  const url = URL.createObjectURL(blob)

  // Create a link element
  const link = document.createElement("a")
  link.href = url
  link.download = `${backupId}.${encrypted ? "encrypted." : ""}json`

  // Append the link to the body
  document.body.appendChild(link)

  // Click the link to trigger the download
  link.click()

  // Clean up
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function BackupScheduler() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("schedule")
  const [isBackupInProgress, setIsBackupInProgress] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)

  // Schedule settings
  const [backupEnabled, setBackupEnabled] = useState(true)
  const [frequency, setFrequency] = useState("daily")
  const [timeOfDay, setTimeOfDay] = useState("02:00")
  const [retentionPeriod, setRetentionPeriod] = useState("30")

  // Storage settings
  const [storageType, setStorageType] = useState("cloud")
  const [cloudProvider, setCloudProvider] = useState("aws")
  const [localPath, setLocalPath] = useState("/var/backups/appointmenthub")

  // Data settings
  const [backupData, setBackupData] = useState<string[]>(["appointments", "users", "chats", "emails", "settings"])

  // Encryption settings
  const [encryptBackups, setEncryptBackups] = useState(true)
  const [encryptionMethod, setEncryptionMethod] = useState("key")
  const [encryptionKeyId, setEncryptionKeyId] = useState<string | null>(null)
  const [encryptionPassword, setEncryptionPassword] = useState("")
  const [encryptionAlgorithm, setEncryptionAlgorithm] = useState("aes-256")

  // Toggle backup data selection
  const toggleBackupData = (dataType: string) => {
    if (backupData.includes(dataType)) {
      setBackupData(backupData.filter((type) => type !== dataType))
    } else {
      setBackupData([...backupData, dataType])
    }
  }

  // Handle encryption key selection
  const handleSelectEncryptionKey = (keyId: string) => {
    setEncryptionKeyId(keyId)
  }

  // Start manual backup
  const startManualBackup = () => {
    if (backupData.length === 0) {
      toast({
        title: "No data selected",
        description: "Please select at least one data type to backup.",
        variant: "destructive",
      })
      return
    }

    // Validate encryption settings if enabled
    if (encryptBackups) {
      if (encryptionMethod === "password" && !encryptionPassword) {
        toast({
          title: "Encryption Password Required",
          description: "Please enter a password for encrypting the backup.",
          variant: "destructive",
        })
        return
      }

      if (encryptionMethod === "key" && !encryptionKeyId) {
        toast({
          title: "Encryption Key Required",
          description: "Please select an encryption key for encrypting the backup.",
          variant: "destructive",
        })
        return
      }
    }

    setIsBackupInProgress(true)
    setBackupProgress(0)
    setActiveTab("history")

    // Generate a unique backup ID
    const backupId = `backup-${Date.now().toString().slice(-6)}`

    // Simulate backup progress
    const interval = setInterval(() => {
      setBackupProgress((prev) => {
        const newProgress = prev + Math.random() * 15
        if (newProgress >= 100) {
          clearInterval(interval)

          // Simulate backup completion
          setTimeout(() => {
            // Trigger file download
            downloadMockBackupFile(backupId, encryptBackups)

            setIsBackupInProgress(false)

            toast({
              title: "Backup Completed",
              description: `Your data has been successfully backed up${encryptBackups ? " with encryption" : ""}.`,
            })
          }, 500)

          return 100
        }
        return newProgress
      })
    }, 400)
  }

  // Save schedule settings
  const saveScheduleSettings = () => {
    toast({
      title: "Backup Schedule Updated",
      description: `Automatic backups will run ${frequency} at ${timeOfDay}${
        encryptBackups ? " with encryption" : ""
      }.`,
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            <Check className="mr-1 h-3 w-3" /> Completed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            <X className="mr-1 h-3 w-3" /> Failed
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <RefreshCw className="mr-1 h-3 w-3 animate-spin" /> In Progress
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Database className="mr-2 h-4 w-4" />
          Backup & Restore
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Data Backup & Restore</DialogTitle>
          <DialogDescription>Configure automatic backups or manually backup your data.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="backup-enabled">Automatic Backups</Label>
                <p className="text-sm text-muted-foreground">Enable or disable scheduled backups</p>
              </div>
              <Switch id="backup-enabled" checked={backupEnabled} onCheckedChange={setBackupEnabled} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Backup Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency} disabled={!backupEnabled}>
                <SelectTrigger id="frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-of-day">Time of Day</Label>
              <div className="relative">
                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time-of-day"
                  type="time"
                  className="pl-8"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  disabled={!backupEnabled || frequency === "hourly"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention">Retention Period (days)</Label>
              <Select value={retentionPeriod} onValueChange={setRetentionPeriod} disabled={!backupEnabled}>
                <SelectTrigger id="retention">
                  <SelectValue placeholder="Select retention period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data to Backup</Label>
              <div className="border rounded-md p-4 grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="backup-appointments"
                    checked={backupData.includes("appointments")}
                    onCheckedChange={() => toggleBackupData("appointments")}
                    disabled={!backupEnabled}
                  />
                  <Label htmlFor="backup-appointments" className="cursor-pointer">
                    Appointments
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="backup-users"
                    checked={backupData.includes("users")}
                    onCheckedChange={() => toggleBackupData("users")}
                    disabled={!backupEnabled}
                  />
                  <Label htmlFor="backup-users" className="cursor-pointer">
                    Users
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="backup-chats"
                    checked={backupData.includes("chats")}
                    onCheckedChange={() => toggleBackupData("chats")}
                    disabled={!backupEnabled}
                  />
                  <Label htmlFor="backup-chats" className="cursor-pointer">
                    Chat Logs
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="backup-emails"
                    checked={backupData.includes("emails")}
                    onCheckedChange={() => toggleBackupData("emails")}
                    disabled={!backupEnabled}
                  />
                  <Label htmlFor="backup-emails" className="cursor-pointer">
                    Email Logs
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="backup-settings"
                    checked={backupData.includes("settings")}
                    onCheckedChange={() => toggleBackupData("settings")}
                    disabled={!backupEnabled}
                  />
                  <Label htmlFor="backup-settings" className="cursor-pointer">
                    System Settings
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveTab("storage")}>
                Next: Storage Settings
              </Button>
              <Button onClick={saveScheduleSettings} disabled={!backupEnabled}>
                Save Schedule
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="storage" className="space-y-4">
            <div className="space-y-2">
              <Label>Storage Location</Label>
              <RadioGroup value={storageType} onValueChange={setStorageType} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cloud" id="cloud" />
                  <Label htmlFor="cloud" className="flex items-center cursor-pointer">
                    <Cloud className="mr-2 h-4 w-4 text-blue-600" />
                    Cloud Storage
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="local" id="local" />
                  <Label htmlFor="local" className="flex items-center cursor-pointer">
                    <HardDrive className="mr-2 h-4 w-4 text-green-600" />
                    Local Storage
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {storageType === "cloud" && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="cloud-provider">Cloud Provider</Label>
                <Select value={cloudProvider} onValueChange={setCloudProvider}>
                  <SelectTrigger id="cloud-provider">
                    <SelectValue placeholder="Select cloud provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aws">Amazon S3</SelectItem>
                    <SelectItem value="gcp">Google Cloud Storage</SelectItem>
                    <SelectItem value="azure">Microsoft Azure Blob Storage</SelectItem>
                    <SelectItem value="dropbox">Dropbox</SelectItem>
                  </SelectContent>
                </Select>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="bucket-name">Bucket/Container Name</Label>
                  <Input id="bucket-name" defaultValue="appointmenthub-backups" placeholder="Enter bucket name" />
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="path-prefix">Path Prefix</Label>
                  <Input id="path-prefix" defaultValue="backups/" placeholder="Enter path prefix" />
                </div>
              </div>
            )}

            {storageType === "local" && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="local-path">Local Path</Label>
                <Input
                  id="local-path"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  placeholder="Enter local path"
                />

                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox id="compress-backups" defaultChecked />
                  <Label htmlFor="compress-backups" className="cursor-pointer">
                    Compress backups
                  </Label>
                </div>
              </div>
            )}

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-medium">Connection Test</h3>
                  <p className="text-sm text-muted-foreground">Test connection to storage location</p>
                </div>
                <Button variant="outline" size="sm">
                  Test Connection
                </Button>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveTab("schedule")}>
                Back: Schedule
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("security")}>
                Next: Security
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="encrypt-backups">Encrypt Backups</Label>
                <p className="text-sm text-muted-foreground">Add encryption to protect your backup data</p>
              </div>
              <Switch id="encrypt-backups" checked={encryptBackups} onCheckedChange={setEncryptBackups} />
            </div>

            {encryptBackups && (
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
                        <Lock className="mr-2 h-4 w-4 text-primary" />
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
                      backup files later.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Encryption Algorithm</Label>
                  <Select value={encryptionAlgorithm} onValueChange={setEncryptionAlgorithm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select encryption algorithm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aes-256">AES-256 (Recommended)</SelectItem>
                      <SelectItem value="aes-192">AES-192</SelectItem>
                      <SelectItem value="aes-128">AES-128</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    AES-256 provides the strongest encryption but may be slightly slower.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                  <p className="font-medium">Important Security Notice</p>
                  <p className="mt-1">
                    {encryptionMethod === "key"
                      ? "Make sure you have access to this encryption key when you need to restore from backup. If you lose access to the key, you won't be able to recover the data."
                      : "Store this password in a secure location. If you forget this password, you will not be able to restore from backup."}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveTab("storage")}>
                Back: Storage
              </Button>
              <Button onClick={startManualBackup}>
                <Save className="mr-2 h-4 w-4" />
                Run Manual Backup
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {isBackupInProgress && (
              <div className="py-4 space-y-4 border rounded-md p-4 bg-muted/30">
                <div className="text-center">
                  <h3 className="text-lg font-medium">Backup in Progress</h3>
                  <p className="text-sm text-muted-foreground">Please wait while your data is being backed up.</p>
                  {encryptBackups && (
                    <Badge className="mt-2 bg-primary">
                      <Shield className="mr-1 h-3 w-3" /> Encrypted
                    </Badge>
                  )}
                </div>
                <Progress value={backupProgress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {backupProgress < 100 ? `${Math.round(backupProgress)}% complete...` : "Finalizing backup..."}
                </p>
              </div>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Backup ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isBackupInProgress && (
                    <TableRow>
                      <TableCell className="font-medium">backup-new</TableCell>
                      <TableCell>{format(new Date(), "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell>{getStatusBadge("in_progress")}</TableCell>
                      <TableCell>--</TableCell>
                      <TableCell>
                        {storageType === "cloud" ? `Cloud Storage (${cloudProvider.toUpperCase()})` : "Local Storage"}
                        {encryptBackups && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            <Shield className="mr-1 h-3 w-3" /> Encrypted
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">--</TableCell>
                    </TableRow>
                  )}

                  {backupHistory.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.id}</TableCell>
                      <TableCell>{format(new Date(backup.timestamp), "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell>{getStatusBadge(backup.status)}</TableCell>
                      <TableCell>{backup.size}</TableCell>
                      <TableCell>
                        {backup.location}
                        {backup.encrypted && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            <Shield className="mr-1 h-3 w-3" /> Encrypted
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                downloadMockBackupFile(backup.id, backup.encrypted)
                                toast({
                                  title: "Backup Downloaded",
                                  description: `Backup ${backup.id} has been downloaded.`,
                                })
                              }}
                            >
                              Download Backup
                            </DropdownMenuItem>
                            <DropdownMenuItem>Restore from Backup</DropdownMenuItem>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            {backup.status === "failed" && <DropdownMenuItem>Retry Backup</DropdownMenuItem>}
                            <DropdownMenuItem className="text-destructive">Delete Backup</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveTab("security")}>
                Back: Security Settings
              </Button>
              <Button onClick={startManualBackup} disabled={isBackupInProgress}>
                <Save className="mr-2 h-4 w-4" />
                Run Manual Backup
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
