import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Button as UIButton } from "@/components/ui/button";

export function IdleTimeoutTabContent() {
    const [enabled, setEnabled] = useState(false);
    const [ignoreIfChatting, setIgnoreIfChatting] = useState(false);
    const [inactivityPeriod, setInactivityPeriod] = useState(15);
    const [idleStatus, setIdleStatus] = useState("away");

    return (
        <>
            <Card className="w-full mt-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold mb-2">Idle timeout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 ">
                            <span className="font-medium text-sm">Idle timeout</span>
                            <UIButton
                                type="button"
                                size={"sm"}
                                variant={enabled ? "default" : "outline"}
                                className={enabled ? "bg-primary  text-white" : ""}
                                onClick={() => setEnabled(true)}
                            >
                                On
                            </UIButton>
                            <UIButton
                                size={"sm"}
                                type="button"
                                variant={!enabled ? "default" : "outline"}
                                className={!enabled ? "bg-primary text-white" : ""}
                                onClick={() => setEnabled(false)}
                            >
                                Off
                            </UIButton>
                        </div>
                        <p className="text-sm text-muted-foreground">Set your status to Away or Invisible after a period on inactivity.</p>
                        <div className="flex items-center gap-2 mt-2">
                            <Checkbox
                                checked={ignoreIfChatting}
                                onCheckedChange={(checked) => setIgnoreIfChatting(checked === true)}
                                id="ignoreIfChatting"
                                disabled={!enabled}
                            />
                            <label htmlFor="ignoreIfChatting" className={`text-sm ${!enabled ? "text-muted-foreground" : ""}`}>Do not change my status if I have open chat windows</label>
                        </div>
                        <div className="mt-2">
                            <label className="font-medium text-sm block mb-1">Inactivity period</label>
                            <input
                                type="number"
                                min={1}
                                max={120}
                                value={inactivityPeriod}
                                onChange={e => setInactivityPeriod(Number(e.target.value))}
                                className="border rounded px-3 py-2 w-24"
                                disabled={!enabled}
                            />
                            <span className="text-xs text-muted-foreground ml-2">Time (in minutes) before going Away or Invisible.</span>
                        </div>
                        <div className="mt-2">
                            <span className="font-medium text-sm block mb-2">Idle status</span>
                            <div className="flex gap-6">
                                <label className={`flex items-center gap-2 text-sm ${!enabled ? "text-muted-foreground" : ""}`}>
                                    <input
                                        type="radio"
                                        name="idleStatus"
                                        value="away"
                                        checked={idleStatus === "away"}
                                        onChange={() => setIdleStatus("away")}
                                        disabled={!enabled}
                                    />
                                    Away
                                </label>
                                <label className={`flex items-center gap-2 text-sm ${!enabled ? "text-muted-foreground" : ""}`}>
                                    <input
                                        type="radio"
                                        name="idleStatus"
                                        value="invisible"
                                        checked={idleStatus === "invisible"}
                                        onChange={() => setIdleStatus("invisible")}
                                        disabled={!enabled}
                                    />
                                    Invisible
                                </label>
                            </div>
                        </div>
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
