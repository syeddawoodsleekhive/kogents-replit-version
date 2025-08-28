import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button as UIButton } from "@/components/ui/button";
import { useState } from "react";

export function FileSendingTabContent() {
    const [enabled, setEnabled] = useState(true);
    const [fileTypeOption, setFileTypeOption] = useState("all");
    const [fileTypes, setFileTypes] = useState(".svg, .docs, .mp4");
    const [riskAccepted, setRiskAccepted] = useState(true);

    return (
        <>
            <Card className="w-full mt-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold mb-2">File sending</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">File sending</span>
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
                    <p className="text-sm text-muted-foreground mb-4">Set your preferences for receiving and sending files during a chat. Specify allowed safe file extensions below. <a href="#" className="text-blue-600 underline">Learn about file sending preferences</a></p>
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="radio"
                                name="fileTypeOption"
                                checked={fileTypeOption === "limited"}
                                onChange={() => setFileTypeOption("limited")}
                                disabled={!enabled}
                            />
                            <span className="text-sm">Sharing is limited to PDF (.pdf), PNG (.png), JPEG (.jpg), GIF (.gif) or text (.txt) file types.</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="radio"
                                name="fileTypeOption"
                                checked={fileTypeOption === "all"}
                                onChange={() => setFileTypeOption("all")}
                                disabled={!enabled}
                            />
                            <span className="text-sm">Allow PDF (.pdf), PNG (.png), JPEG (.jpg), GIF (.gif), text (.txt), and the additional file types specified below.</span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2 ml-6">Use commas to separate file types. Include a period (.) before each extension. Example: .svg, .html</div>
                        <textarea
                            className="border rounded px-3 py-2 w-full h-20"
                            value={fileTypes}
                            onChange={e => setFileTypes(e.target.value)}
                            disabled={!enabled || fileTypeOption !== "all"}
                        />
                    </div>
                    <div className="bg-gray-100 border rounded p-4 flex items-start gap-2 mb-4">
                        <Checkbox checked={riskAccepted} onCheckedChange={(checked) => setRiskAccepted(checked === true)} id="riskAccepted" />
                        <div>
                            <span className="text-sm">I understand there may be potential risks associated with allowing these extensions and agree to assume these risks when enabling extensions.</span>
                            <p className="text-xs text-muted-foreground mt-2">Take care to only enable safe extensions that you need for your business operations. If you accept compressed files, keep in mind that they could contain any attachment type when extracted.</p>
                        </div>
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
