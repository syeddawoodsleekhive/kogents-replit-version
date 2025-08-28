import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button as UIButton } from "@/components/ui/button";
import { useState } from "react";

export function EmailPipingTabContent() {
    const [enabled, setEnabled] = useState(false);
    const [email, setEmail] = useState("");

    return (
        <>
            <Card className="w-full mt-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold mb-2">Email piping</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">Email piping</span>
                        <UIButton
                            type="button"
                            variant={enabled ? "default" : "outline"}
                            className={enabled ? "bg-primary text-white" : ""}
                            onClick={() => setEnabled(true)}
                        >
                            On
                        </UIButton>
                        <UIButton
                            type="button"
                            variant={!enabled ? "default" : "outline"}
                            className={!enabled ? "bg-primary text-white" : ""}
                            onClick={() => setEnabled(false)}
                        >
                            Off
                        </UIButton>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Automatically send the chat transcript to your email after the chat ends.</p>
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="email"
                            className="border rounded px-3 py-2 w-64"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={!enabled}
                            placeholder="Enter email address"
                        />
                        <UIButton type="button" variant="outline" disabled={!enabled}>+</UIButton>
                    </div>
                </CardContent>
            </Card>
            <div className="flex gap-2 pt-6">
                <UIButton type="button" className="bg-primary text-white">Save changes</UIButton>
                <UIButton type="button" variant="outline">Revert changes</UIButton>
            </div>
        </>

    );
}
