import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button as UIButton } from "@/components/ui/button";
import { useState } from "react";

export function SecurityTabContent() {
    const [redactEnabled, setRedactEnabled] = useState(false);

    return (
        <>
            <Card className="w-full mt-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold mb-2">Authentication options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-yellow-100 border border-yellow-300 rounded p-4 text-sm text-yellow-900 mb-4">
                        <span className="font-semibold">Restricted feature</span><br />
                        Your current package does not include these features. <a href="#" className="text-blue-600 underline">Upgrade your package</a> to unlock them.
                    </div>
                    <div className="mb-6">
                        <div className="font-bold text-lg mb-2">Authentication options</div>
                        <p className="text-sm text-muted-foreground mb-2">Manage how your agents sign in to your Zendesk account.</p>
                        <UIButton type="button" className="bg-primary text-white">Manage</UIButton>
                    </div>
                    <div className="mb-6">
                        <div className="font-bold text-lg mb-2">Automatic redaction</div>
                        <p className="text-sm text-muted-foreground mb-2">Automatically redact credit card numbers submitted by visitors during chat sessions to protect sensitive data. If a set of numbers matches a credit card pattern, some digits will be replaced with block characters. <a href="#" className="text-blue-600 underline">Learn more</a></p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-muted-foreground">Credit card redaction</span>
                            <Checkbox checked={redactEnabled} onCheckedChange={(checked) => setRedactEnabled(checked === true)} id="redactEnabled" disabled />
                            <label htmlFor="redactEnabled" className="text-sm text-muted-foreground">Enable automatic redaction of credit card numbers</label>
                        </div>
                    </div>

                </CardContent>
            </Card>
            <div className="flex gap-2 pt-6">
                <UIButton type="button" className="bg-primary text-white" disabled>Save changes</UIButton>
                <UIButton type="button" variant="outline" disabled>Revert changes</UIButton>
            </div>
        </>
    );
}
