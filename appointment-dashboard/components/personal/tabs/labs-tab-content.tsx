import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Button as UIButton } from "@/components/ui/button";

export function LabsTabContent() {
    const [dockedPanel, setDockedPanel] = useState(false);

    return (
        <>
            <Card className="w-full mt-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold mb-2">Chat panel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="mb-6">
                        <div className="bg-yellow-50 border border-yellow-300 rounded p-4 text-sm text-yellow-900 flex items-center gap-2">
                            <span className="text-lg">⚠️</span>
                            <span>These features are experimental and may be changed or removed.</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="font-medium">Docked chat panel</span>
                        <Checkbox checked={dockedPanel} onCheckedChange={(checked) => setDockedPanel(checked === true)} id="dockedPanel" />
                        <label htmlFor="dockedPanel" className="text-sm">Attach chat panel to right edge of screen</label>
                    </div>
                </CardContent>
            </Card>
            <div className="flex gap-2 pt-6 justify-between">
                <div>
                    <UIButton type="button" className="bg-primary text-white">Save changes</UIButton>
                    <UIButton type="button" variant="outline" className="ml-2">Revert changes</UIButton>
                </div>
                <UIButton type="button" variant="outline">Reset to defaults</UIButton>
            </div>
        </>
    );
}
