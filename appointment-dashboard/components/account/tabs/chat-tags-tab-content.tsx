import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button as UIButton } from "@/components/ui/button";
import { useState } from "react";

const initialTags = {
    "2": ["2in1"],
    "3": ["3in1"],
    "B": ["branding", "bronze"],
    "C": ["closed"],
    "E": ["edward"],
    "F": ["follow", "followup"],
    "G": ["gold"],
    "L": ["lead", "lo", "lolead"],
    "P": ["platinum", "pricing-shared", "probundle"],
    "S": ["silver", "skeptic"],
};

export function ChatTagsTabContent() {
    const [allowTagCreation, setAllowTagCreation] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [tags, setTags] = useState(initialTags);

    return (
        <div className="flex gap-8 w-full mt-8">
            <div className="flex-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold mb-2">General preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Checkbox checked={allowTagCreation} onCheckedChange={(checked) => setAllowTagCreation(checked === true)} id="allowTagCreation" />
                            <label htmlFor="allowTagCreation" className="text-sm">Allow admins to create new tags during chats. If not enabled, admins can only create tags in the predefined tags list below and in shortcuts.</label>
                        </div>
                        <div className="bg-gray-100 border rounded p-2 text-xs text-muted-foreground mb-4">
                            Admins can create new tags under <span className="font-semibold">Settings &gt; Shortcuts</span> and edit chat tags in <span className="font-semibold">History</span>.
                        </div>
                        <CardTitle className="text-xl font-bold mb-2">Predefined tags list</CardTitle>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-2">Add or delete tags from your account's list of available tags. Deleting a tag here does not remove it from existing chats. Spaces and special characters other than underscore (_) and hyphen (-) are not allowed. <a href="#" className="text-blue-600 underline">Learn more</a></p>
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="text"
                                    className="border rounded px-3 py-2 w-64"
                                    value={newTag}
                                    onChange={e => setNewTag(e.target.value)}
                                    placeholder="Add new tag"
                                />
                                <UIButton type="button" variant="outline">+</UIButton>
                            </div>
                            <div className="space-y-2">
                                {Object.entries(tags).map(([key, tagList]) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <span className="font-bold w-6">{key}</span>
                                        {tagList.map(tag => (
                                            <span key={tag} className="bg-gray-200 rounded px-2 py-1 text-xs mr-1">{tag}</span>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </CardContent>

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
                        <p className="text-sm text-muted-foreground">Using chat tags<br />Tag your chats manually during a chat or add tags to shortcuts to automatically tag the chat when you use them.<br /><br />Other tags<br />Tags added by triggers or through the JS API are separate and do not appear here.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
