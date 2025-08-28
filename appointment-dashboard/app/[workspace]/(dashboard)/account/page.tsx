"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionTabContent } from "@/components/account/tabs/subscription-tab-content";
import { AppsTabContent } from "@/components/account/tabs/apps-tab-content";
import { ApiSdksTabContent } from "@/components/account/tabs/api-sdks-tab-content";
import { EmailPipingTabContent } from "@/components/account/tabs/email-piping-tab-content";
import { ChatTagsTabContent } from "@/components/account/tabs/chat-tags-tab-content";
import { FileSendingTabContent } from "@/components/account/tabs/file-sending-tab-content";
import { OperatingHoursTabContent } from "@/components/account/tabs/operating-hours-tab-content";
import { TimezoneTabContent } from "@/components/account/tabs/timezone-tab-content";
import { SecurityTabContent } from "@/components/account/tabs/security-tab-content";
import { VisitorListTabContent } from "@/components/account/tabs/visitor-list-tab-content";

export default function AccountPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Account</h1>
        </div>
        <Tabs defaultValue="subscription" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="apps">Apps</TabsTrigger>
            <TabsTrigger value="api">API & SDKs</TabsTrigger>
            <TabsTrigger value="email">Email piping</TabsTrigger>
            <TabsTrigger value="tags">Chat tags</TabsTrigger>
            <TabsTrigger value="files">File sending</TabsTrigger>
            <TabsTrigger value="hours">Operating hours</TabsTrigger>
            <TabsTrigger value="timezone">Timezone</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="visitor">Visitor List</TabsTrigger>
          </TabsList>
          <TabsContent value="subscription">
            <SubscriptionTabContent />
          </TabsContent>
          <TabsContent value="apps">
            <AppsTabContent />
          </TabsContent>
          <TabsContent value="api">
            <ApiSdksTabContent />
          </TabsContent>
          <TabsContent value="email">
            <EmailPipingTabContent />
          </TabsContent>
          <TabsContent value="tags">
            <ChatTagsTabContent />
          </TabsContent>
          <TabsContent value="files">
            <FileSendingTabContent />
          </TabsContent>
          <TabsContent value="hours">
            <OperatingHoursTabContent />
          </TabsContent>
          <TabsContent value="timezone">
            <TimezoneTabContent />
          </TabsContent>
          <TabsContent value="security">
            <SecurityTabContent />
          </TabsContent>
          <TabsContent value="visitor">
            <VisitorListTabContent />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
