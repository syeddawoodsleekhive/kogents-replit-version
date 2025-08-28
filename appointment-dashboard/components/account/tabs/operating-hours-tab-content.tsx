import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button as UIButton } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

export function OperatingHoursTabContent() {
    const [enabled, setEnabled] = useState(false);
    const [displayHours, setDisplayHours] = useState(false);
    const days = [
        { name: "Monday", open: true, hours: [9, 17] },
        { name: "Tuesday", open: true, hours: [9, 17] },
        { name: "Wednesday", open: true, hours: [9, 17] },
        { name: "Thursday", open: true, hours: [9, 17] },
        { name: "Friday", open: true, hours: [9, 17] },
        { name: "Saturday", open: false, hours: [0, 0] },
        { name: "Sunday", open: false, hours: [0, 0] },
    ];

    return (
        <div className="flex gap-8 w-full mt-8">
            <div className="flex-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold mb-2">Operating hours</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-yellow-100 border border-yellow-300 rounded p-4 text-sm text-yellow-900 mb-4">
                            <span className="font-semibold">Restricted feature</span><br />
                            The operating hours feature is unavailable for your package. <a href="#" className="text-blue-600 underline">Upgrade your account</a> to the Professional or Enterprise plan to enable this feature.
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">Operating hours</span>
                            <UIButton
                                type="button"
                                size={"sm"}
                                variant={enabled ? "default" : "outline"}
                                className={enabled ? "bg-primary text-white" : ""}
                                onClick={() => setEnabled(true)}
                            >
                                On
                            </UIButton>
                            <UIButton
                                type="button"
                                size={"sm"}
                                variant={!enabled ? "default" : "outline"}
                                className={!enabled ? "bg-primary text-white" : ""}
                                onClick={() => setEnabled(false)}
                            >
                                Off
                            </UIButton>
                        </div>
                        <CardDescription className="mb-2">Configure your operating hours schedule for your account. Schedules can be account-wide or department-specific and determine when your widget appears online to visitors. <a href="#" className="text-blue-600 underline">Learn more</a></CardDescription>
                        <div className="flex gap-4 mb-4">
                            <div>
                                <label className="text-sm font-medium">Set schedule</label>
                                <div className="flex gap-2 mt-1">
                                    <UIButton type="button" variant="default" disabled>Account</UIButton>
                                    <UIButton type="button" variant="outline" disabled>Department</UIButton>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Online schedule</label>
                                <select className="border rounded px-2 py-1 text-sm" disabled>
                                    <option>Daily</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2 mb-4">
                            {days.map((day, idx) => (
                                <div key={day.name} className="flex items-center gap-4">
                                    <Checkbox checked={day.open} disabled />
                                    <span className="font-medium w-24">{day.name}</span>
                                    {day.open ? (
                                        <span className="text-sm">(9:00 AM – 5:00 PM)</span>
                                        // <Slider value={[day.hours[0], day.hours[1]]} min={0} max={24} step={1} disabled />
                                    ) : (
                                        <span className="text-sm text-muted-foreground">(Closed all day)</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="bg-gray-100 border rounded p-2 text-xs text-muted-foreground mb-4">
                            Change your timezone under <span className="font-semibold">Settings &gt; Account &gt; Timezone</span>.
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <Checkbox checked={displayHours} onCheckedChange={(checked) => setDisplayHours(checked === true)} id="displayHours" />
                            <label htmlFor="displayHours" className="text-sm">Show operating hours on offline and pre-chat forms. Forms must be enabled under Settings &gt; Widget &gt; Forms.</label>
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
            </div>
            <div className="w-64">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold mb-2">Quick tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Operating hours<br />Create multiple schedules to manage your operating hours. There are two types of schedules: account-wide and department-specific.<br /><br />Account schedule<br />A single account-wide schedule that applies across your entire account. You cannot use department-specific schedules.<br /><br />Department schedule<br />Multiple departments can use department schedules. Each department can use multiple schedules and multiple departments can also be part of the same schedule.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
