import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button as UIButton } from "@/components/ui/button";
import { useState } from "react";

export function VisitorListTabContent() {
    const [highLoad, setHighLoad] = useState(false);

    return (
        <>
            <Card className="w-full mt-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold mb-2">Visitor List (High Load Dashboard)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground mb-4">The High Load Dashboard is an alternative version of the Visitor List that only shows visitors in your Incoming Chats and Currently Served sections. All other visitors are hidden.</p>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="font-medium text-sm">High Load Dashboard</span>
                        <Checkbox checked={highLoad} onCheckedChange={(checked) => setHighLoad(checked === true)} id="highLoad" />
                        <label htmlFor="highLoad" className="text-sm">Enable this for websites with high visitor traffic</label>
                    </div>
                </CardContent>
            </Card>
            <div className="flex gap-2 pt-6 justify-between">
                <div className="flex gap-2">
                    <UIButton type="button" className="bg-primary text-white">Save changes</UIButton>
                    <UIButton type="button" variant="outline">Revert changes</UIButton>
                </div>
                <UIButton type="button" variant="outline">Reset to defaults</UIButton>
            </div>
        </>
    );
}
