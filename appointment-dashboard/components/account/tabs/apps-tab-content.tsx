import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button as UIButton } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";

const filterOptions = [
    "All",
    "Public Apps",
    "Private Apps",
    "Preview Apps"
];

export function AppsTabContent() {
    const [filter, setFilter] = useState("All");
    const [tab, setTab] = useState("installed");

    return (
        <div className="flex gap-8 w-full mt-8">
            <div className="flex-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold mb-2">My Apps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-yellow-100 border border-yellow-300 rounded p-4 text-sm text-yellow-900 mb-4">
                            Private apps are not available on your plan. <a href="#" className="text-blue-600 underline">Upgrade</a> for access to upload your own private apps.
                        </div>
                        <Tabs value={tab} onValueChange={setTab} className="mb-6">
                            <TabsList>
                                <TabsTrigger value="installed">Currently Installed</TabsTrigger>
                                <TabsTrigger value="private">Private Apps</TabsTrigger>
                            </TabsList>
                            <TabsContent value="installed">
                                <div className="flex items-center justify-between mb-6">
                                    <div></div>
                                    <UIButton type="button" variant="outline">Marketplace</UIButton>
                                </div>
                                <div className="mb-4 inline-block">
                                    <Select value={filter} onValueChange={setFilter}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Filter apps" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filterOptions.map(opt => (
                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="mb-6 text-sm">
                                    <div className="font-medium mb-1">Enabled apps</div>
                                    <div className="text-sm text-muted-foreground">Enabled apps in your Zendesk</div>
                                </div>
                                <div className="mb-6 text-sm">
                                    <div className="font-medium mb-1">Disabled apps</div>
                                    <div className="text-sm text-muted-foreground">Disabled apps in your Zendesk</div>
                                </div>
                            </TabsContent>
                            <TabsContent value="private">
                                <div className="mt-6">
                                    <div className="font-bold mb-2">Private Apps</div>
                                    <div className="text-sm text-muted-foreground">These Private Apps are ready to install</div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
                <div className="pt-6">
                    <UIButton type="button" className="bg-primary text-white">Reorder apps</UIButton>
                </div>
            </div>
            <div className="w-64">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold mb-2">Quick tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Apps enable you to add functionality to your Zendesk Chat account. You can discover and install apps from the <a href="#" className="text-blue-600 underline">Zendesk Marketplace</a>.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
