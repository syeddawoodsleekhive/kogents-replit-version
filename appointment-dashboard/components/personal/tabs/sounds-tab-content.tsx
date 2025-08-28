import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { Button as UIButton } from "@/components/ui/button";
import { Volume1Icon, Volume2Icon } from "lucide-react";

export function SoundsTabContent() {
    const soundOptions = [
        { value: "bonk", label: "Bonk" },
        { value: "oh-oh", label: "Oh oh" },
        { value: "dong", label: "Dong" },
        { value: "door-knock", label: "Door knock" },
        { value: "alert", label: "Alert" },
    ];
    const [incomingVisitor, setIncomingVisitor] = useState("bonk");
    const [incomingVisitorVol, setIncomingVisitorVol] = useState([40]);
    const [chatRequest, setChatRequest] = useState("oh-oh");
    const [chatRequestVol, setChatRequestVol] = useState([80]);
    const [chatRequestRepeat, setChatRequestRepeat] = useState(1);
    const [incomingMessage, setIncomingMessage] = useState("dong");
    const [incomingMessageVol, setIncomingMessageVol] = useState([50]);
    const [autoStatusChange, setAutoStatusChange] = useState("bonk");
    const [autoStatusChangeVol, setAutoStatusChangeVol] = useState([50]);
    const [triggerActivated, setTriggerActivated] = useState("door-knock");
    const [triggerActivatedVol, setTriggerActivatedVol] = useState([50]);
    const [operatingHours, setOperatingHours] = useState("alert");
    const [operatingHoursVol, setOperatingHoursVol] = useState([50]);

    return (
        <>
            <Card className="w-full mt-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold mb-2">Sounds</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-6">
                        {/* Incoming visitor */}
                        <div>
                            <label className="font-medium block mb-1 text-sm">Incoming visitor</label>
                            <Select value={incomingVisitor} onValueChange={setIncomingVisitor}>
                                <SelectTrigger className="w-56">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {soundOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2 mt-2">
                                <Volume1Icon className="w-5 h-5 text-gray-500" />
                                <Slider value={incomingVisitorVol} onValueChange={setIncomingVisitorVol} max={100} step={1} className="w-48" />
                                <Volume2Icon className="w-5 h-5 text-gray-500" />
                            </div>
                        </div>
                        {/* Chat request */}
                        <div>
                            <label className="font-medium block mb-1 text-sm">Chat request</label>
                            <Select value={chatRequest} onValueChange={setChatRequest}>
                                <SelectTrigger className="w-56">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {soundOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2 mt-2">
                                <Volume1Icon className="w-5 h-5 text-gray-500" />
                                <Slider value={chatRequestVol} onValueChange={setChatRequestVol} max={100} step={1} className="w-48" />
                                <Volume2Icon className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <label className="text-sm">Repeat:</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={chatRequestRepeat}
                                    onChange={e => setChatRequestRepeat(Number(e.target.value))}
                                    className="border rounded px-2 py-1 w-16 text-sm"
                                />
                                <span className="text-xs">(1 to 10)</span>
                            </div>
                        </div>
                        {/* Incoming message */}
                        <div>
                            <label className="font-medium block mb-1 text-sm">Incoming message</label>
                            <Select value={incomingMessage} onValueChange={setIncomingMessage}>
                                <SelectTrigger className="w-56">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {soundOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2 mt-2">
                                <Volume1Icon className="w-5 h-5 text-gray-500" />
                                <Slider value={incomingMessageVol} onValueChange={setIncomingMessageVol} max={100} step={1} className="w-48" />
                                <Volume2Icon className="w-5 h-5 text-gray-500" />
                            </div>
                        </div>
                        {/* Automatic status change */}
                        <div>
                            <label className="font-medium block mb-1 text-sm">Automatic status change</label>
                            <Select value={autoStatusChange} onValueChange={setAutoStatusChange}>
                                <SelectTrigger className="w-56">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {soundOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2 mt-2">
                                <Volume1Icon className="w-5 h-5 text-gray-500" />
                                <Slider value={autoStatusChangeVol} onValueChange={setAutoStatusChangeVol} max={100} step={1} className="w-48" />
                                <Volume2Icon className="w-5 h-5 text-gray-500" />
                            </div>
                        </div>
                        {/* Trigger activated */}
                        <div>
                            <label className="font-medium block mb-1 text-sm">Trigger activated</label>
                            <Select value={triggerActivated} onValueChange={setTriggerActivated}>
                                <SelectTrigger className="w-56">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {soundOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2 mt-2">
                                <Volume1Icon className="w-5 h-5 text-gray-500" />
                                <Slider value={triggerActivatedVol} onValueChange={setTriggerActivatedVol} max={100} step={1} className="w-48" />
                                <Volume2Icon className="w-5 h-5 text-gray-500" />
                            </div>
                        </div>
                        {/* Operating hours start/end */}
                        <div>
                            <label className="font-medium block mb-1 text-sm">Operating hours start/end</label>
                            <Select value={operatingHours} onValueChange={setOperatingHours}>
                                <SelectTrigger className="w-56">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {soundOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2 mt-2">
                                <Volume1Icon className="w-5 h-5 text-gray-500" />
                                <Slider value={operatingHoursVol} onValueChange={setOperatingHoursVol} max={100} step={1} className="w-48" />
                                <Volume2Icon className="w-5 h-5 text-gray-500" />
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
