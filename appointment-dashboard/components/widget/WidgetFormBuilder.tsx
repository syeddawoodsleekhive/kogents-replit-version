"use client";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectLabel,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
  ChatBadge,
  FormField,
  OfflineChatForm,
  PostChatSurvey,
  PreChatForm,
  SurveyQuestion,
  UserInfoForm,
  WidgetContent,
  WidgetSettings,
} from "@/types/widget";
import {
  CheckSquare,
  FormInput,
  GripVertical,
  List,
  Mail,
  MessageSquare,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { Separator } from "../ui/separator";
import React from "react";

interface WidgetFormBuilderProps {
  settings: WidgetSettings;
  preChatForm: PreChatForm;
  offlineChatForm: OfflineChatForm;
  postChatSurvey: PostChatSurvey;
  userInfoForm: UserInfoForm;
  chatBadge: ChatBadge;
  onUpdatePreChat: (form: Partial<PreChatForm>) => void;
  onUpdateOfflineChat: (form: Partial<OfflineChatForm>) => void;
  onUpdateUserInfo: (user: Partial<UserInfoForm>) => void;
  onUpdatePostChat: (survey: Partial<PostChatSurvey>) => void;
  onUpdateChatBadge: (survey: Partial<ChatBadge>) => void;
  updateContent: (content: Partial<WidgetContent>) => void;
}

export function WidgetFormBuilder({
  settings,
  preChatForm,
  offlineChatForm,
  postChatSurvey,
  userInfoForm,
  chatBadge,
  onUpdatePreChat,
  onUpdateOfflineChat,
  onUpdateUserInfo,
  onUpdateChatBadge,
  onUpdatePostChat,
  updateContent,
}: WidgetFormBuilderProps) {
  const fieldTypes = [
    { value: "text", label: "Text Input", icon: FormInput },
    { value: "email", label: "Email", icon: Mail },
    { value: "select", label: "Dropdown", icon: List },
    { value: "textarea", label: "Text Area", icon: MessageSquare },
    { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  ];

  // User Info Form Settings
  const addUserInfoField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      type: "text",
      label: "New Field",
      placeholder: "",
      required: false,
      order: userInfoForm.fields.length,
    };

    onUpdateUserInfo({
      fields: [...userInfoForm.fields, newField],
    });
  };

  const updateUserInfoField = (
    fieldId: string,
    updates: Partial<FormField>
  ) => {
    const updatedFields = userInfoForm.fields.map((field) =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    onUpdateUserInfo({ fields: updatedFields });
  };

  const removeUserInfoField = (fieldId: string) => {
    const updatedFields = userInfoForm.fields.filter(
      (field) => field.id !== fieldId
    );
    onUpdateUserInfo({ fields: updatedFields });
  };

  const formOptions = [
    {
      label: "When Online",
      list: [
        {
          value: "post-chat",
          title: "Post-Chat Form",
          isDisable: !postChatSurvey.enabled,
        },
        { value: "chat-window", title: "Chat Window", isDisable: false },
        {
          value: "pre-chat",
          title: "Pre-Chat Form",
          isDisable: !preChatForm.enabled,
        },
        {
          value: "chat-badge",
          title: "Chat Badge",
          isDisable: !chatBadge.enabled,
        },
      ],
    },
    {
      label: "When Offline",
      list: [
        {
          value: "offline-chat",
          title: "Offline-Chat Form",
          isDisable: !offlineChatForm.enabled,
        },
      ],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">Form Builder</div>
          <Select
            value={settings.content.formType}
            onValueChange={(
              value:
                | "chat-window"
                | "pre-chat"
                | "offline-chat"
                | "post-chat"
                | "chat-badge"
            ) => updateContent({ formType: value })}
          >
            <SelectTrigger className="w-fit focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formOptions.map((form) => (
                <SelectGroup key={form.label}>
                  <SelectLabel className="-ml-7">{form.label}</SelectLabel>
                  {form.list.map((item) => (
                    <SelectItem
                      key={item.value}
                      disabled={item.isDisable}
                      value={item.value}
                    >
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
        <CardDescription>
          Create pre-chat forms and post-chat surveys to collect visitor
          information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pre-chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pre-chat">Pre-Chat Form</TabsTrigger>
            <TabsTrigger value="offline-chat">Offline-Chat Form</TabsTrigger>
            <TabsTrigger value="post-chat">Post-Chat Form</TabsTrigger>
            <TabsTrigger value="userinfo">User-Info Form</TabsTrigger>
            <TabsTrigger value="chat-badge">Chat Badge</TabsTrigger>
          </TabsList>

          {/* Pre-Chat Form Settings */}
          <TabsContent value="pre-chat" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Pre-Chat Form</Label>
                  <p className="text-sm text-muted-foreground">
                    Collect visitor information before starting a chat
                  </p>
                </div>
                <Switch
                  checked={preChatForm.enabled}
                  onCheckedChange={(checked) =>
                    onUpdatePreChat({ enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Required Form</Label>
                  <p className="text-sm text-muted-foreground">
                    Visitors must complete the form to start chatting
                  </p>
                </div>
                <Switch
                  checked={preChatForm.required}
                  onCheckedChange={(checked) =>
                    onUpdatePreChat({ required: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Pre-chat Greetings</Label>
                <Input
                  value={preChatForm.greetingsMessage}
                  onChange={(e) =>
                    onUpdatePreChat({ greetingsMessage: e.target.value })
                  }
                  placeholder="Type your message..."
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Required Identity</Label>
                  <p className="text-sm text-muted-foreground">
                    Visitors must provide their name and email.
                  </p>
                </div>
                <Switch
                  checked={preChatForm.isIdentityRequired}
                  onCheckedChange={(checked) =>
                    onUpdatePreChat({ isIdentityRequired: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Required Phone Number</Label>
                  <p className="text-sm text-muted-foreground">
                    Visitors must enter their phone number before starting a
                    chat.
                  </p>
                </div>
                <Switch
                  checked={preChatForm.isPhoneRequired}
                  onCheckedChange={(checked) =>
                    onUpdatePreChat({ isPhoneRequired: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Required Question</Label>
                  <p className="text-sm text-muted-foreground">
                    Visitors must enter a questionto ask your agents before
                    starting a chat.
                  </p>
                </div>
                <Switch
                  checked={preChatForm.isQuestionRequired}
                  onCheckedChange={(checked) =>
                    onUpdatePreChat({ isQuestionRequired: checked })
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Offline Form Settings */}
          <TabsContent value="offline-chat" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Offline Form</Label>
                  <p className="text-sm text-muted-foreground">
                    Collect visitor information and message on offline mode
                  </p>
                </div>
                <Switch
                  checked={offlineChatForm.enabled}
                  onCheckedChange={(checked) =>
                    onUpdateOfflineChat({ enabled: checked })
                  }
                />
              </div>

              {/* <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Required Form</Label>
                  <p className="text-sm text-muted-foreground">
                    Visitors must complete this form when agents are offline.
                  </p>
                </div>
                <Switch
                  checked={offlineChatForm.required}
                  onCheckedChange={(checked) =>
                    onUpdateOfflineChat({ required: checked })
                  }
                />
              </div> */}

              <Separator />

              <div className="space-y-2">
                <Label>Offline Greetings</Label>
                <Input
                  value={offlineChatForm.greetingsMessage}
                  onChange={(e) =>
                    onUpdateOfflineChat({ greetingsMessage: e.target.value })
                  }
                  placeholder="Type your message..."
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Required Phone Number</Label>
                  <p className="text-sm text-muted-foreground">
                    Visitors must enter their phone number for offline mode.
                  </p>
                </div>
                <Switch
                  checked={offlineChatForm.isPhoneRequired}
                  onCheckedChange={(checked) =>
                    onUpdateOfflineChat({ isPhoneRequired: checked })
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Post-Chat Survey Settings */}
          <TabsContent value="post-chat" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Post-Chat Survey</Label>
                  <p className="text-sm text-muted-foreground">
                    Collect feedback after chat conversations end
                  </p>
                </div>
                <Switch
                  checked={postChatSurvey.enabled}
                  onCheckedChange={(checked) =>
                    onUpdatePostChat({ enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Required Form</Label>
                  <p className="text-sm text-muted-foreground">
                    Visitors must complete the form to end this chat.
                  </p>
                </div>
                <Switch
                  checked={postChatSurvey.required}
                  onCheckedChange={(checked) =>
                    onUpdatePostChat({ required: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Thank You Message</Label>
                <Input
                  value={postChatSurvey.thankYouMessage}
                  onChange={(e) =>
                    onUpdatePostChat({ thankYouMessage: e.target.value })
                  }
                  placeholder="Thank you for your feedback!"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Required Ratings</Label>
                  <p className="text-sm text-muted-foreground">
                    Visitors must fill this field to end this chat.
                  </p>
                </div>
                <Switch
                  checked={postChatSurvey.isRatingsRequired}
                  onCheckedChange={(checked) =>
                    onUpdatePostChat({ isRatingsRequired: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Required Feedback</Label>
                  <p className="text-sm text-muted-foreground">
                    Visitors must fill this field to end this chat.
                  </p>
                </div>
                <Switch
                  checked={postChatSurvey.isFeedbackRequired}
                  onCheckedChange={(checked) =>
                    onUpdatePostChat({ isFeedbackRequired: checked })
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="userinfo" className="space-y-6">
            {/* User-Info Form Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable User-Info Form</Label>
                  <p className="text-sm text-muted-foreground">
                    Collect visitor information before starting a chat
                  </p>
                </div>
                <Switch
                  checked={userInfoForm.enabled}
                  onCheckedChange={(checked) =>
                    onUpdateUserInfo({
                      enabled: checked,
                      showUserInfoForm: false,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Required Form</Label>
                  <p className="text-sm text-muted-foreground">
                    Visitors must complete the form to start chatting
                  </p>
                </div>
                <Switch
                  checked={userInfoForm.required}
                  onCheckedChange={(checked) =>
                    onUpdateUserInfo({ required: checked })
                  }
                />
              </div>
            </div>

            {/* User-Info Form */}
            {userInfoForm.enabled && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Form Fields</Label>
                  <Button onClick={addUserInfoField} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                <div className="space-y-4">
                  {userInfoForm.fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <Badge variant="outline">Field {index + 1}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUserInfoField(field.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Field Type</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value: any) =>
                                updateUserInfoField(field.id, { type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {fieldTypes.map((type) => (
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                  >
                                    <div className="flex items-center gap-2">
                                      <type.icon className="w-4 h-4" />
                                      {type.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Field Label</Label>
                            <Input
                              value={field.label}
                              onChange={(e) =>
                                updateUserInfoField(field.id, {
                                  label: e.target.value,
                                })
                              }
                              placeholder="Enter field label"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Placeholder Text</Label>
                            <Input
                              value={field.placeholder || ""}
                              onChange={(e) =>
                                updateUserInfoField(field.id, {
                                  placeholder: e.target.value,
                                })
                              }
                              placeholder="Enter placeholder text"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`required-${field.id}`}
                              checked={field.required}
                              onCheckedChange={(checked) =>
                                updateUserInfoField(field.id, {
                                  required: checked,
                                })
                              }
                            />
                            <Label htmlFor={`required-${field.id}`}>
                              Required Field
                            </Label>
                          </div>
                        </div>

                        {(field.type === "select" ||
                          field.type === "checkbox") && (
                          <div className="space-y-2">
                            <Label>Options (one per line)</Label>
                            <Textarea
                              value={field.options?.join("\n") || ""}
                              onChange={(e) =>
                                updateUserInfoField(field.id, {
                                  options: e.target.value
                                    .split("\n")
                                    .filter(Boolean),
                                })
                              }
                              placeholder="Option 1&#10;Option 2&#10;Option 3"
                              rows={3}
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}

                  {userInfoForm.fields.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FormInput className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No form fields added yet</p>
                      <p className="text-sm">
                        Click "Add Field" to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Chat Badge */}
          <TabsContent value="chat-badge" className="space-y-6">
            {/* Chat-Badge Form Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Chat-Badge</Label>
                  <p className="text-sm text-muted-foreground">
                    Collect visitor information before starting a chat
                  </p>
                </div>
                <Switch
                  checked={chatBadge.enabled}
                  onCheckedChange={(checked) =>
                    onUpdateChatBadge({
                      enabled: checked,
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
