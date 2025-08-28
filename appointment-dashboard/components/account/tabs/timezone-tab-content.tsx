import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button as UIButton } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";

const timezones = [
    { value: "America/New_York", label: "(UTC-04:00) America/New York" },
    { value: "Europe/London", label: "(UTC+00:00) Europe/London" },
    { value: "Asia/Karachi", label: "(UTC+05:00) Asia/Karachi" },
    { value: "UTC", label: "(UTC+00:00) UTC" },
];

export function TimezoneTabContent() {
    const [timezone, setTimezone] = useState("America/New_York");

    return (
        <div className="flex gap-8 w-full mt-8">
            <div className="flex-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold mb-2">Timezone</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-sm text-muted-foreground mb-4">Select the timezone for your account.</p>
                        <Select  value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger className="w-72 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {timezones.map(tz => (
                                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                        <p className="text-sm text-muted-foreground">Timezone<br />The timezone is account specific and affects all admins. You should select a timezone where a majority of your admins or your head office is located.<br /><br />The default timezone is set to UTC. <a href="#" className="text-blue-600 underline">Learn more</a></p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
