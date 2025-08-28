"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Loader2, Plus, Trash2, TestTube } from "lucide-react"
import type { WebhookConfig } from "@/types/triggers"
import { defaultWebhookPayload, validateWebhookConfig } from "@/utils/triggerUtils"

interface WebhookConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: WebhookConfig | null
  onSave: (config: WebhookConfig) => void
  onTest?: (config: WebhookConfig) => Promise<{ success: boolean; error?: string; responseTime: number }>
}

export function WebhookConfigDialog({ open, onOpenChange, config, onSave, onTest }: WebhookConfigDialogProps) {
  const [formData, setFormData] = useState<WebhookConfig>(() => ({
    url: config?.url || "",
    method: config?.method || "POST",
    headers: config?.headers || {},
    payloadTemplate: config?.payloadTemplate || defaultWebhookPayload,
    timeout: config?.timeout || 30,
    retryAttempts: config?.retryAttempts || 3,
    authentication: config?.authentication || { type: "none" },
  }))

  const [newHeaderKey, setNewHeaderKey] = useState("")
  const [newHeaderValue, setNewHeaderValue] = useState("")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string; responseTime: number } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    const validationError = validateWebhookConfig(formData)

    if (validationError) {
      newErrors.general = validationError
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData)
      onOpenChange(false)
    }
  }

  const handleTest = async () => {
    if (!onTest || !validateForm()) return

    setTesting(true)
    setTestResult(null)

    try {
      const result = await onTest(formData)
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: 0,
      })
    } finally {
      setTesting(false)
    }
  }

  const addHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setFormData((prev) => ({
        ...prev,
        headers: {
          ...prev.headers,
          [newHeaderKey]: newHeaderValue,
        },
      }))
      setNewHeaderKey("")
      setNewHeaderValue("")
    }
  }

  const removeHeader = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      headers: Object.fromEntries(Object.entries(prev.headers).filter(([k]) => k !== key)),
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Webhook</DialogTitle>
          <DialogDescription>
            Set up webhook configuration to send data to external services when triggers are executed.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="payload">Payload</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Configuration</CardTitle>
                <CardDescription>Configure the webhook URL and request settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Webhook URL *</Label>
                    <Input
                      id="url"
                      value={formData.url}
                      onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                      placeholder="https://api.example.com/webhooks"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">HTTP Method</Label>
                    <Select
                      value={formData.method}
                      onValueChange={(value: "POST" | "PUT" | "PATCH") =>
                        setFormData((prev) => ({ ...prev, method: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      min="1"
                      max="60"
                      value={formData.timeout}
                      onChange={(e) => setFormData((prev) => ({ ...prev, timeout: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retryAttempts">Retry Attempts</Label>
                    <Input
                      id="retryAttempts"
                      type="number"
                      min="0"
                      max="5"
                      value={formData.retryAttempts}
                      onChange={(e) => setFormData((prev) => ({ ...prev, retryAttempts: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="headers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>HTTP Headers</CardTitle>
                <CardDescription>Add custom headers to be sent with the webhook request</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Header name"
                    value={newHeaderKey}
                    onChange={(e) => setNewHeaderKey(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Header value"
                      value={newHeaderValue}
                      onChange={(e) => setNewHeaderValue(e.target.value)}
                    />
                    <Button onClick={addHeader} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {Object.entries(formData.headers).length > 0 && (
                  <div className="space-y-2">
                    <Label>Current Headers</Label>
                    <div className="space-y-2">
                      {Object.entries(formData.headers).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{key}</Badge>
                            <span className="text-sm text-muted-foreground">{value}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeHeader(key)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>Configure authentication for the webhook endpoint</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Authentication Type</Label>
                  <Select
                    value={formData.authentication?.type || "none"}
                    onValueChange={(value: "none" | "bearer" | "basic" | "api_key") =>
                      setFormData((prev) => ({
                        ...prev,
                        authentication: { type: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.authentication?.type === "bearer" && (
                  <div className="space-y-2">
                    <Label>Bearer Token</Label>
                    <Input
                      type="password"
                      value={formData.authentication.token || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          authentication: { ...prev.authentication!, token: e.target.value },
                        }))
                      }
                      placeholder="Enter bearer token"
                    />
                  </div>
                )}

                {formData.authentication?.type === "basic" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        value={formData.authentication.username || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            authentication: { ...prev.authentication!, username: e.target.value },
                          }))
                        }
                        placeholder="Username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={formData.authentication.password || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            authentication: { ...prev.authentication!, password: e.target.value },
                          }))
                        }
                        placeholder="Password"
                      />
                    </div>
                  </div>
                )}

                {formData.authentication?.type === "api_key" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Header Name</Label>
                      <Input
                        value={formData.authentication.apiKeyHeader || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            authentication: { ...prev.authentication!, apiKeyHeader: e.target.value },
                          }))
                        }
                        placeholder="X-API-Key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={formData.authentication.apiKey || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            authentication: { ...prev.authentication!, apiKey: e.target.value },
                          }))
                        }
                        placeholder="Enter API key"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payload Template</CardTitle>
                <CardDescription>
                  Define the JSON payload template using variables like {`{{customer.email}}`} and{" "}
                  {`{{conversation.id}}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>JSON Template</Label>
                  <Textarea
                    value={formData.payloadTemplate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, payloadTemplate: e.target.value }))}
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Available Variables</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {[
                      "{{trigger.id}}",
                      "{{trigger.name}}",
                      "{{conversation.id}}",
                      "{{conversation.priority}}",
                      "{{conversation.department}}",
                      "{{customer.email}}",
                      "{{customer.name}}",
                      "{{customer.tags}}",
                      "{{message.content}}",
                      "{{message.timestamp}}",
                      "{{agent.id}}",
                      "{{agent.name}}",
                      "{{agent.department}}",
                    ].map((variable) => (
                      <Badge key={variable} variant="secondary" className="font-mono">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {errors.general && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{errors.general}</span>
          </div>
        )}

        {testResult && (
          <div
            className={`flex items-center gap-2 p-3 border rounded ${
              testResult.success
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span className="text-sm">
              {testResult.success
                ? `Webhook test successful (${testResult.responseTime}ms)`
                : `Webhook test failed: ${testResult.error}`}
            </span>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {onTest && (
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Webhook
                </>
              )}
            </Button>
          )}
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
