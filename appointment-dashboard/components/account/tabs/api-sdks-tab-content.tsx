import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button as UIButton } from "@/components/ui/button";

export function ApiSdksTabContent() {
  return (
    <div className="flex gap-8 w-full mt-8">
      <div className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold mb-2">API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-100 border border-yellow-300 rounded p-4 text-sm text-yellow-900 mb-4">
              Upgrade to the Enterprise plan for access to the real-time APIs.
            </div>
            <CardDescription className="mb-2">Integrate Zendesk Chat features in your own applications to create agents, update visitor information, or delete chats.</CardDescription>
            <div className="flex items-center gap-2 mb-2">
              <UIButton type="button" size={"sm"} className="bg-primary text-white">Add API client</UIButton>
              <span className="text-xs text-muted-foreground">0 active</span>
            </div>
            <table className="w-full text-sm mb-8">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left"><input type="checkbox" disabled /></th>
                  <th className="py-2 text-left">Name</th>
                  <th className="py-2 text-left">Company</th>
                  <th className="py-2 text-left">Client ID</th>
                </tr>
              </thead>
              <tbody>
                {/* No active clients */}
              </tbody>
            </table>
            <CardTitle className="text-xl font-bold mb-2">Mobile SDK</CardTitle>
            <CardDescription className="mb-2">Integrate Zendesk Chat into your mobile apps using the iOS and Android SDKs. Available on all paid plans. <a href="#" className="text-blue-600 underline">Learn more</a></CardDescription>
            <div className="flex items-center gap-2 mb-2">
              <UIButton type="button" size={"sm"} className="bg-primary text-white">Add app</UIButton>
              <span className="text-xs text-muted-foreground">0 active</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left"><input type="checkbox" disabled /></th>
                  <th className="py-2 text-left">Name</th>
                  <th className="py-2 text-left">Platform</th>
                  <th className="py-2 text-left">Date modified ▼</th>
                  <th className="py-2 text-left">App ID</th>
                </tr>
              </thead>
              <tbody>
                {/* No active apps */}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
      <div className="w-64">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold mb-2">Quick tips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Your use and access to the API is expressly conditioned on your compliance with the policies, restrictions, and other provisions related to the API set forth in our <a href="#" className="text-blue-600 underline">API Restrictions and Responsibilities</a> and the other documentation we provide you.<br /><br />You must also comply with the restrictions set forth in the <a href="#" className="text-blue-600 underline">Zendesk Terms and Conditions</a> and the <a href="#" className="text-blue-600 underline">Zendesk Privacy Policy</a>, in all uses of the API.<br /><br />If Zendesk believes that you have or attempted to violate any term, condition, or the spirit of these policies or agreements, your right to access and use the API may be temporarily or permanently revoked. <a href="#" className="text-blue-600 underline">Learn more</a></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
