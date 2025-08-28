import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Button as UIButton } from "@/components/ui/button";

export function PreferencesTabContent() {
  const [language, setLanguage] = useState("English");
  const [chatLimit, setChatLimit] = useState("3");
  const [skills, setSkills] = useState("");
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(true);
  const [offlineNotification, setOfflineNotification] = useState(true);
  const [zendeskUpdates, setZendeskUpdates] = useState(true);

  return (
    <Card className="w-full mt-8">
      <CardHeader>
        <CardTitle className="text-xl font-bold mb-2">Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="font-medium block mb-1 text-sm">Dashboard language</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Urdu">Urdu</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="font-medium block text-sm mb-1">Chat limit</label>
            <input
              type="number"
              className="border rounded px-3 py-2 w-24"
              value={chatLimit}
              onChange={e => setChatLimit(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Number of chats you are allowed to take. Admins can edit other chat routing settings under Routing &gt; Settings.</p>
            <span className="font-semibold text-xs mt-1 block">Chat limit is not enabled</span>
          </div>
          <div>
            <label className="font-medium block mb-1 text-sm">Skills</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={skills}
              onChange={e => setSkills(e.target.value)}
              placeholder=""
            />
            <p className="text-xs text-muted-foreground mt-1">Identify the agent's capabilities. Assign up to 5 skills per agent. Add skills under Routing &gt; Skills.</p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={keyboardShortcuts} onCheckedChange={(check:boolean)=> setKeyboardShortcuts(check)} id="keyboardShortcuts" />
            <label htmlFor="keyboardShortcuts" className="text-sm">Enable keyboard shortcuts</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={offlineNotification} onCheckedChange={(check:boolean)=> setOfflineNotification(check)} id="offlineNotification" />
            <label htmlFor="offlineNotification" className="text-sm">Receive email notification when visitors send an offline message</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={zendeskUpdates} onCheckedChange={(check:boolean)=> setZendeskUpdates(check)} id="zendeskUpdates" />
            <label htmlFor="zendeskUpdates" className="text-sm">Receive periodic email updates from Zendesk Chat</label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
