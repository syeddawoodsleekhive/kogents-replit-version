"use client";

import { Plus, BookOpen, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { memo } from "react";
import Link from "next/link";

const WelcomeSectionComponent = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-xl">Create new chatbot</CardTitle>
          <CardDescription>
            Check out our detailed docs to learn how to format your data and
            create the perfect bot for your needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Link href="/demo-company/chatbots/create" className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create bot
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-xl">
            Need help building your AI chatbots?
          </CardTitle>
          <CardDescription>
            Join our community and ask the ChatBotBuilder Team for assistance
            with your projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" className="bg-white dark:bg-gray-900">
            <BookOpen className="h-4 w-4 mr-2" />
            View Docs
          </Button>
          <Button variant="outline" className="bg-white dark:bg-gray-900">
            <Zap className="h-4 w-4 mr-2" />
            Get Help
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export const WelcomeSection = memo(WelcomeSectionComponent);
export default WelcomeSection;
