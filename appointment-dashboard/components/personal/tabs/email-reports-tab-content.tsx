import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Button as UIButton } from "@/components/ui/button";

export function EmailReportsTabContent() {
    // Simulate restricted feature (e.g. only weekly enabled)
    const [daily, setDaily] = useState(false);
    const [weekly, setWeekly] = useState(true);
    const [monthly, setMonthly] = useState(false);
    const restricted = true;

    return (
        <>
            <Card className="w-full mt-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold mb-2">Analytics reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="mb-6">
                        <div className="bg-yellow-100 border border-yellow-300 rounded p-4 text-sm text-yellow-900">
                            <span className="font-semibold">Restricted feature</span><br />
                            Your current package does not include these features. <a href="#" className="text-blue-600 underline">Upgrade your package</a> to unlock them.
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-2">Analytics reports</h3>
                        <p className="text-sm text-muted-foreground mb-4">Track website statistics and agent performance.</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Checkbox checked={daily} onCheckedChange={() => { }} disabled />
                                <span className="text-sm text-muted-foreground">Receive daily email reports</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox checked={weekly} onCheckedChange={() => { }} disabled />
                                <span className="text-sm text-muted-foreground">Receive weekly email reports (sent every Sunday)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox checked={monthly} onCheckedChange={() => { }} disabled />
                                <span className="text-sm text-muted-foreground">Receive monthly email reports (sent every first day of the month)</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="flex gap-2 pt-6">
                <UIButton type="button" className="bg-primary text-white">Save changes</UIButton>
                <UIButton type="button" variant="outline">Revert changes</UIButton>
                <UIButton type="button" variant="outline" className="ml-auto">Reset to defaults</UIButton>
            </div>
        </>
    );
}
