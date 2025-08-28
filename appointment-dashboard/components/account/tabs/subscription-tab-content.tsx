import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button as UIButton } from "@/components/ui/button";

export function SubscriptionTabContent() {
    return (
        <>
            <Card className="w-full mt-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold mb-2">Team plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <CardDescription className="mb-2">
                        The features of your current plan are shown below. Compare Zendesk Chat's <a href="#" className="text-blue-600 underline">pricing plans</a>.
                    </CardDescription>
                    <div className="space-y-2">
                        <div className="flex items-center text-sm justify-between">
                            <span className="font-medium">Agents</span>
                            <span>31 of 32 agents used</span>
                        </div>
                        <div className="flex items-center text-sm justify-between">
                            <span className="font-medium">Concurrent chats</span>
                            <span>Unlimited</span>
                        </div>
                        <div className="flex items-center text-sm justify-between">
                            <span className="font-medium">Triggers</span>
                            <span>2</span>
                        </div>
                        <div className="flex items-center text-sm justify-between">
                            <span className="font-medium">Departments</span>
                            <span>2</span>
                        </div>
                        <div className="flex items-center text-sm justify-between">
                            <span className="font-medium">Web Widget (Classic) customization</span>
                            <span>Yes</span>
                        </div>
                    </div>
                    <p className="text-sm mt-4">
                        Visit <a href="#" className="text-blue-600 underline">Account management</a> to upgrade your plan or add more agents at any time.
                    </p>
                </CardContent>
            </Card>
            <div className="pt-6">
                <UIButton type="button" className="bg-primary text-white">Adjust plan</UIButton>
            </div>
        </>

    );
}
