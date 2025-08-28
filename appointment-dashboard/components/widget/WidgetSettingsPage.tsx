"use client";

import { useWidgetSettings } from "@/hooks/useWidgetSettings";
import React from "react";

import { WidgetThemeEditor } from "./WidgetThemeEditor";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Code,
  Eye,
  FormInput,
  Lock,
  MessageSquare,
  Palette,
  RotateCcw,
  Save,
  Settings,
  Volume2,
} from "lucide-react";
import { WidgetBehaviorEditor } from "./WidgetBehaviorEditor";
import { WidgetCodeGenerator } from "./WidgetCodeGenerator";
import { WidgetFormBuilder } from "./WidgetFormBuilder";
import { WidgetPreview } from "./WidgetPreview";
import WidgetSoundEditor from "./WidgetSoundEditor";
import { WidgetSecurityEditor } from "./WidgetSecurityEditor";

export function WidgetSettingsPage() {
  const {
    settings,
    isLoading,
    error,
    updateAppearance,
    updateBehavior,
    updateContent,
    updateIntegration,
    updateSecurity,
    updateSoundSettings,
    generateEmbedCode,
    saveSettings,
    resetSettings,
  } = useWidgetSettings();

  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("integration");
  const [showPreview, setShowPreview] = React.useState(true);

  const handleSave = async () => {
    try {
      await saveSettings();
      toast({
        title: "Settings saved",
        description: "Your widget settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    resetSettings();
    toast({
      title: "Settings reset",
      description: "Widget settings have been reset to defaults.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Widget Settings</h1>
          <p className="text-muted-foreground">
            Customize your chat widget appearance and behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? "Hide" : "Show"} Preview
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-5">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger
                value="integration"
                className="flex items-center gap-2"
              >
                <Code className="min-w-4 min-h-4 w-4 h-4" />
                <span className="hidden sm:inline">Code</span>
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="flex items-center gap-2"
              >
                <Palette className="min-w-4 min-h-4 w-4 h-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="sound" className="flex items-center gap-2">
                <Volume2 className="min-w-4 min-h-4 w-4 h-4" />
                <span className="hidden sm:inline">Sound</span>
              </TabsTrigger>
              <TabsTrigger value="behavior" className="flex items-center gap-2">
                <Settings className="min-w-4 min-h-4 w-4 h-4" />
                <span className="hidden sm:inline">Behavior</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <MessageSquare className="min-w-4 min-h-4 w-4 h-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
              <TabsTrigger value="forms" className="flex items-center gap-2">
                <FormInput className="min-w-4 min-h-4 w-4 h-4" />
                <span className="hidden sm:inline">Forms</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="min-w-4 min-h-4 w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="integration">
              <WidgetCodeGenerator
                settings={settings}
                onGenerateCode={generateEmbedCode}
                onUpdate={updateIntegration}
              />
            </TabsContent>

            <TabsContent value="appearance">
              <WidgetThemeEditor
                appearance={settings.appearance}
                onUpdate={updateAppearance}
              />
            </TabsContent>

            <TabsContent value="sound">
              <WidgetSoundEditor
                sound={settings.sound}
                onUpdate={updateSoundSettings}
              />
            </TabsContent>

            <TabsContent value="behavior" className="space-y-6">
              <WidgetBehaviorEditor
                behavior={settings.behavior}
                updateBehavior={updateBehavior}
              />
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Widget Content</CardTitle>
                  <CardDescription>
                    Customize messages and text displayed in your widget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>AI Message</Label>
                    <Input
                      value={settings.content.welcomeMessage}
                      onChange={(e) =>
                        updateContent({ welcomeMessage: e.target.value })
                      }
                      placeholder="Welcome! How can we help you?"
                    />
                  </div>

                  {/* <div className="space-y-2">
                    <Label>Offline Message</Label>
                    <Input
                      value={settings.content.offlineMessage}
                      onChange={(e) =>
                        updateContent({ offlineMessage: e.target.value })
                      }
                      placeholder="We're currently offline. Please leave a message."
                    />
                  </div> */}

                  <div className="space-y-2">
                    <Label>Input Placeholder</Label>
                    <Input
                      value={settings.content.placeholderText}
                      onChange={(e) =>
                        updateContent({ placeholderText: e.target.value })
                      }
                      placeholder="Type your message..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Thank You Message</Label>
                    <Input
                      value={settings.content.thankYouMessage}
                      onChange={(e) =>
                        updateContent({ thankYouMessage: e.target.value })
                      }
                      placeholder="Thank you for contacting us!"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forms">
              <WidgetFormBuilder
                settings={settings}
                preChatForm={settings.content.preChatForm}
                offlineChatForm={settings.content.offlineChatForm}
                postChatSurvey={settings.content.postChatSurvey}
                userInfoForm={settings.content.userInfoForm}
                chatBadge={settings.content.chatBadge}
                onUpdatePreChat={(form) =>
                  updateContent({
                    preChatForm: { ...settings.content.preChatForm, ...form },
                  })
                }
                onUpdateOfflineChat={(form) =>
                  updateContent({
                    offlineChatForm: {
                      ...settings.content.offlineChatForm,
                      ...form,
                    },
                  })
                }
                onUpdateUserInfo={(form) =>
                  updateContent({
                    userInfoForm: { ...settings.content.userInfoForm, ...form },
                  })
                }
                onUpdatePostChat={(survey) =>
                  updateContent({
                    postChatSurvey: {
                      ...settings.content.postChatSurvey,
                      ...survey,
                    },
                  })
                }
                onUpdateChatBadge={(badge) =>
                  updateContent({
                    chatBadge: {
                      ...settings.content.chatBadge,
                      ...badge,
                    },
                  })
                }
                updateContent={updateContent}
              />
            </TabsContent>

            <TabsContent value="security">
              <WidgetSecurityEditor
                settings={settings}
                onSecurityUpdate={updateSecurity}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="lg:col-span-3">
            <div className="sticky top-6">
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>
                    See how your widget will look on your website
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <WidgetPreview
                    settings={settings}
                    onSoundUpdate={updateSoundSettings}
                    onContentUpdate={updateContent}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
