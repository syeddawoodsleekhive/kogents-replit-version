import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BackupScheduler } from "@/components/backup-scheduler"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DataExportDialog } from "@/components/data-export-dialog"
import { Download, Key, Lock, Shield, Upload } from "lucide-react"
import { EncryptionKeyManager } from "@/components/encryption-key-manager"

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">System Settings</h1>
        </div>

        <Tabs defaultValue="data" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="data">Data Management</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="account">Account Settings</TabsTrigger>
            <TabsTrigger value="system">System Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="data">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Data Export</CardTitle>
                  <CardDescription>Export your data in various formats for backup or analysis.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Export your data in CSV, Excel, or PDF format. You can choose which data to export and customize the
                    export options.
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <h3 className="font-medium">Appointments</h3>
                        <p className="text-sm text-muted-foreground">Export appointment data</p>
                      </div>
                      <DataExportDialog
                        dataType="appointments"
                        trigger={
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </Button>
                        }
                      />
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <h3 className="font-medium">Users</h3>
                        <p className="text-sm text-muted-foreground">Export user data</p>
                      </div>
                      <DataExportDialog
                        dataType="users"
                        trigger={
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </Button>
                        }
                      />
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <h3 className="font-medium">Chat Logs</h3>
                        <p className="text-sm text-muted-foreground">Export chat conversation data</p>
                      </div>
                      <DataExportDialog
                        dataType="chats"
                        trigger={
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </Button>
                        }
                      />
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <h3 className="font-medium">Email Logs</h3>
                        <p className="text-sm text-muted-foreground">Export email communication data</p>
                      </div>
                      <DataExportDialog
                        dataType="emails"
                        trigger={
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </Button>
                        }
                      />
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <h3 className="font-medium">Complete System Backup</h3>
                        <p className="text-sm text-muted-foreground">Export all system data</p>
                      </div>
                      <DataExportDialog
                        dataType="all"
                        trigger={
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export All
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Backup & Restore</CardTitle>
                  <CardDescription>Configure automatic backups or manually backup your data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Set up automatic backups to secure cloud or local storage. You can also manually backup your data or
                    restore from a previous backup.
                  </p>
                  <div className="space-y-4">
                    <BackupScheduler />

                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <h3 className="font-medium">Import Data</h3>
                        <p className="text-sm text-muted-foreground">Restore from a backup file</p>
                      </div>
                      <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Encryption Keys</CardTitle>
                  <CardDescription>Manage encryption keys for secure data protection.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Create and manage encryption keys to secure your exported data and backups. Encryption keys provide
                    an additional layer of security to protect sensitive information.
                  </p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <h3 className="font-medium">Manage Encryption Keys</h3>
                        <p className="text-sm text-muted-foreground">Create, edit, or delete encryption keys</p>
                      </div>
                      <EncryptionKeyManager />
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-amber-800">Security Best Practices</h3>
                          <ul className="mt-2 text-sm text-amber-700 space-y-1 list-disc pl-4">
                            <li>Use strong, unique encryption keys for different purposes</li>
                            <li>Regularly rotate encryption keys for enhanced security</li>
                            <li>Store backup copies of encryption keys in a secure location</li>
                            <li>Use AES-256 encryption for the highest level of security</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Protection</CardTitle>
                  <CardDescription>Configure data protection and encryption settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Configure how your data is protected and encrypted. These settings apply to all data exports and
                    backups unless overridden.
                  </p>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <h3 className="font-medium">Default Encryption</h3>
                        <p className="text-sm text-muted-foreground">Enable encryption by default for all exports</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Lock className="mr-2 h-4 w-4" />
                        Configure
                      </Button>
                    </div>

                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <h3 className="font-medium">Password Policies</h3>
                        <p className="text-sm text-muted-foreground">Set requirements for encryption passwords</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Key className="mr-2 h-4 w-4" />
                        Configure
                      </Button>
                    </div>

                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <h3 className="font-medium">Data Retention</h3>
                        <p className="text-sm text-muted-foreground">Configure how long data is kept</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account settings and preferences.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Account settings will be implemented in a future update.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Configure system-wide settings and preferences.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">System configuration will be implemented in a future update.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
