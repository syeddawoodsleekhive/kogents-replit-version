"use client"

import { useState } from "react"
import { Eye, EyeOff, Key, Lock, Shield, Trash2 } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

// Mock encryption keys
const mockEncryptionKeys = [
  {
    id: "key-1",
    name: "Primary Backup Key",
    type: "aes-256",
    created: "2025-05-01T10:30:00",
    lastUsed: "2025-05-06T02:00:00",
    isDefault: true,
  },
  {
    id: "key-2",
    name: "Export Key",
    type: "aes-256",
    created: "2025-05-02T14:45:00",
    lastUsed: "2025-05-05T16:20:00",
    isDefault: false,
  },
  {
    id: "key-3",
    name: "Emergency Recovery Key",
    type: "rsa-4096",
    created: "2025-04-15T09:15:00",
    lastUsed: null,
    isDefault: false,
  },
]

export function EncryptionKeyManager({ onSelectKey }: { onSelectKey?: (keyId: string) => void }) {
  const [open, setOpen] = useState(false)
  const [keys, setKeys] = useState(mockEncryptionKeys)
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(
    keys.find((key) => key.isDefault)?.id || keys[0]?.id || null,
  )
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyType, setNewKeyType] = useState("aes-256")
  const [newKeyPassword, setNewKeyPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("manage")

  // Handle key selection
  const handleSelectKey = (keyId: string) => {
    setSelectedKeyId(keyId)
    if (onSelectKey) {
      onSelectKey(keyId)
    }
  }

  // Handle setting a key as default
  const handleSetDefault = (keyId: string) => {
    const updatedKeys = keys.map((key) => ({
      ...key,
      isDefault: key.id === keyId,
    }))
    setKeys(updatedKeys)
    toast({
      title: "Default Key Updated",
      description: "The selected key is now set as the default encryption key.",
    })
  }

  // Handle key deletion
  const handleDeleteKey = (keyId: string) => {
    // Don't allow deleting the last key
    if (keys.length <= 1) {
      toast({
        title: "Cannot Delete Key",
        description: "You must have at least one encryption key available.",
        variant: "destructive",
      })
      return
    }

    // If deleting the default key, set another key as default
    const isDefaultKey = keys.find((key) => key.id === keyId)?.isDefault
    const updatedKeys = keys.filter((key) => key.id !== keyId)

    if (isDefaultKey && updatedKeys.length > 0) {
      updatedKeys[0].isDefault = true
    }

    setKeys(updatedKeys)

    // If the selected key was deleted, select the new default key
    if (selectedKeyId === keyId) {
      const newDefaultKey = updatedKeys.find((key) => key.isDefault)?.id || updatedKeys[0]?.id
      setSelectedKeyId(newDefaultKey)
      if (onSelectKey && newDefaultKey) {
        onSelectKey(newDefaultKey)
      }
    }

    toast({
      title: "Encryption Key Deleted",
      description: "The selected encryption key has been deleted.",
    })
  }

  // Handle key creation
  const handleCreateKey = () => {
    // Validate inputs
    if (!newKeyName.trim()) {
      toast({
        title: "Key Name Required",
        description: "Please provide a name for the encryption key.",
        variant: "destructive",
      })
      return
    }

    if (!newKeyPassword) {
      toast({
        title: "Password Required",
        description: "Please provide a password for the encryption key.",
        variant: "destructive",
      })
      return
    }

    if (newKeyPassword !== confirmPassword) {
      toast({
        title: "Passwords Do Not Match",
        description: "The password and confirmation do not match.",
        variant: "destructive",
      })
      return
    }

    // Create new key
    const newKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      type: newKeyType,
      created: new Date().toISOString(),
      lastUsed: null,
      isDefault: keys.length === 0, // Make default if it's the first key
    }

    const updatedKeys = [...keys, newKey]
    setKeys(updatedKeys)

    // Select the new key
    setSelectedKeyId(newKey.id)
    if (onSelectKey) {
      onSelectKey(newKey.id)
    }

    // Reset form
    setNewKeyName("")
    setNewKeyPassword("")
    setConfirmPassword("")
    setShowCreateKey(false)
    setActiveTab("manage")

    toast({
      title: "Encryption Key Created",
      description: "Your new encryption key has been created successfully.",
    })
  }

  // Get selected key
  const selectedKey = keys.find((key) => key.id === selectedKeyId) || null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Key className="mr-2 h-4 w-4" />
          Select Encryption Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Encryption Key Management</DialogTitle>
          <DialogDescription>Manage encryption keys for secure data protection.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="manage">Manage Keys</TabsTrigger>
            <TabsTrigger value="create">Create New Key</TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="space-y-4">
            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-1 divide-y">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className={`p-3 hover:bg-muted/50 cursor-pointer ${selectedKeyId === key.id ? "bg-muted/70" : ""}`}
                    onClick={() => handleSelectKey(key.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {key.name}
                            {key.isDefault && (
                              <Badge variant="outline" className="text-xs bg-primary/10">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {key.type.toUpperCase()} • Created{" "}
                            {new Date(key.created).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!key.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSetDefault(key.id)
                            }}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteKey(key.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {key.lastUsed && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Last used:{" "}
                        {new Date(key.lastUsed).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedKey && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Selected Key: {selectedKey.name}</CardTitle>
                  <CardDescription>This key will be used for encryption.</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Type:</span> {selectedKey.type.toUpperCase()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>{" "}
                        {new Date(selectedKey.created).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setOpen(false)
                      if (onSelectKey) {
                        onSelectKey(selectedKey.id)
                      }
                    }}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Use This Key
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="Enter a name for this key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="key-type">Encryption Algorithm</Label>
                <Select value={newKeyType} onValueChange={setNewKeyType}>
                  <SelectTrigger id="key-type">
                    <SelectValue placeholder="Select encryption algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aes-256">AES-256 (Recommended)</SelectItem>
                    <SelectItem value="aes-192">AES-192</SelectItem>
                    <SelectItem value="aes-128">AES-128</SelectItem>
                    <SelectItem value="rsa-4096">RSA-4096</SelectItem>
                    <SelectItem value="rsa-2048">RSA-2048</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  AES-256 provides the best balance of security and performance for most use cases.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="key-password">Key Password</Label>
                <div className="relative">
                  <Input
                    id="key-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter a strong password"
                    value={newKeyPassword}
                    onChange={(e) => setNewKeyPassword(e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="make-default" />
                  <Label htmlFor="make-default">Make this the default encryption key</Label>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                <p className="font-medium">Important Security Notice</p>
                <p className="mt-1">
                  Store this password in a secure location. If you lose this password, you will not be able to decrypt
                  data encrypted with this key.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {activeTab === "manage" ? (
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setActiveTab("manage")}>
                Cancel
              </Button>
              <Button onClick={handleCreateKey}>Create Key</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
