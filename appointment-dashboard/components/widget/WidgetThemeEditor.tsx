"use client";
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
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WidgetAppearance } from "@/types/widget";
import { Palette } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Separator } from "../ui/separator";

interface WidgetThemeEditorProps {
  appearance: WidgetAppearance;
  onUpdate: (appearance: Partial<WidgetAppearance>) => void;
}

export function WidgetThemeEditor({
  appearance,
  onUpdate,
}: WidgetThemeEditorProps) {
  const colorPresets = [
    { name: "Blue", primary: "#3b82f6", secondary: "#f3f4f6" },
    { name: "Green", primary: "#10b981", secondary: "#f0fdf4" },
    { name: "Purple", primary: "#8b5cf6", secondary: "#faf5ff" },
    { name: "Red", primary: "#ef4444", secondary: "#fef2f2" },
    { name: "Orange", primary: "#f97316", secondary: "#fff7ed" },
    { name: "Pink", primary: "#ec4899", secondary: "#fdf2f8" },
  ];

  const fontOptions = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
    "Source Sans Pro",
    "Arial",
    "Helvetica",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Theme Editor</CardTitle>
        <CardDescription>
          Customize the appearance of your chat widget
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-4 block">
                Color Presets
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {colorPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-center gap-2 bg-transparent"
                    onClick={() =>
                      onUpdate({
                        primaryColor: preset.primary,
                        secondaryColor: preset.secondary,
                      })
                    }
                  >
                    <div className="flex gap-1">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: preset.secondary }}
                      />
                    </div>
                    <span className="text-xs">{preset.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={appearance.primaryColor}
                    onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={appearance.primaryColor}
                    onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={appearance.secondaryColor}
                    onChange={(e) =>
                      onUpdate({ secondaryColor: e.target.value })
                    }
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={appearance.secondaryColor}
                    onChange={(e) =>
                      onUpdate({ secondaryColor: e.target.value })
                    }
                    placeholder="#f3f4f6"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textColor">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={appearance.textColor}
                    onChange={(e) => onUpdate({ textColor: e.target.value })}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={appearance.textColor}
                    onChange={(e) => onUpdate({ textColor: e.target.value })}
                    placeholder="#1f2937"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={appearance.backgroundColor}
                    onChange={(e) =>
                      onUpdate({ backgroundColor: e.target.value })
                    }
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={appearance.backgroundColor}
                    onChange={(e) =>
                      onUpdate({ backgroundColor: e.target.value })
                    }
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            {/* <div className="space-y-2">
              <Label>Theme Mode</Label>
              <Select
                value={appearance.theme}
                onValueChange={(value: "light" | "dark" | "custom") =>
                  onUpdate({ theme: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </TabsContent>

          <TabsContent value="typography" className="space-y-6">
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select
                value={appearance.fontFamily}
                onValueChange={(value) => onUpdate({ fontFamily: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem
                      key={font}
                      value={font}
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Text Size */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Custom Font</Label>
                  <p className="text-sm text-muted-foreground">
                    Use a custom font for the chat widget
                  </p>
                </div>
                <Switch
                  checked={appearance.customFont}
                  onCheckedChange={(checked) =>
                    onUpdate({ customFont: checked })
                  }
                />
              </div>
              {appearance.customFont ? (
                <div className="space-y-2">
                  <Label>Custom Font Size: {appearance.customFontSize}px</Label>
                  <Slider
                    value={[appearance.customFontSize]}
                    onValueChange={([value]) =>
                      onUpdate({ customFontSize: value })
                    }
                    min={12}
                    max={18}
                    step={1}
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <RadioGroup
                    value={appearance.fontSize}
                    onValueChange={(value: string) =>
                      onUpdate({
                        fontSize: value as
                          | "small"
                          | "medium"
                          | "large"
                          | undefined,
                      })
                    }
                    className="ml-7 space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="small" id="text-size-small" />
                      <Label htmlFor="text-size-small" className="text-sm">
                        Small
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="text-size-medium" />
                      <Label htmlFor="text-size-medium" className="text-base">
                        Medium
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="large" id="text-size-large" />
                      <Label htmlFor="text-size-large" className="text-lg">
                        Large
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            <div className="space-y-2">
              <Label>Widget Position</Label>
              <Select
                value={appearance.position}
                onValueChange={(value: any) => onUpdate({ position: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Border Radius */}
            <div className="space-y-2">
              <Label>Border Radius: {appearance.borderRadius}px</Label>
              <Slider
                value={[appearance.borderRadius]}
                onValueChange={([value]) => onUpdate({ borderRadius: value })}
                min={0}
                max={24}
                step={2}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Predefined Chat Size Settings */}
            {!appearance.customeChatSize && (
              <div className="space-y-4  border-gray-200">
                <Label>Widget Size</Label>

                <RadioGroup
                  value={appearance.size}
                  onValueChange={(value: any) => onUpdate({ size: value })}
                >
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <Label className="flex flex-col items-center">
                      <div className="border border-gray-200 rounded-lg p-2 w-full aspect-square relative mb-2 hover:bg-gray-50 cursor-pointer">
                        <div className="absolute inset-4 rounded-md border-2 border-dashed border-gray-300" />
                        <RadioGroupItem
                          value="compact"
                          id="size-compact"
                          className="sr-only"
                        />
                      </div>
                      <p className="text-xs">Small</p>
                    </Label>

                    <Label className="flex flex-col items-center">
                      <div className="border border-gray-200 rounded-lg p-2 w-full aspect-square relative mb-2 hover:bg-gray-50 cursor-pointer">
                        <div className="absolute inset-2 rounded-md border-2 border-dashed border-gray-300" />
                        <RadioGroupItem
                          value="medium"
                          id="size-medium"
                          className="sr-only"
                        />
                      </div>
                      <p className="text-xs">Medium</p>
                    </Label>

                    <Label className="text-xs flex flex-col items-center">
                      <div className="border border-gray-200 rounded-lg p-2 w-full aspect-square relative mb-2 hover:bg-gray-50 cursor-pointer">
                        <div className="absolute inset-0 rounded-md border-2 border-dashed border-gray-300" />
                        <RadioGroupItem
                          value="large"
                          id="size-large"
                          className="sr-only"
                        />
                      </div>
                      <p className="text-xs">Large</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Custom Chat Size Settings */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Custom Size</Label>
                <p className="text-sm text-muted-foreground">
                  Use a custom size for the chat widget
                </p>
              </div>
              <Switch
                checked={appearance.customeChatSize}
                onCheckedChange={(checked) =>
                  onUpdate({ customeChatSize: checked })
                }
              />
            </div>
            {appearance.customeChatSize && (
              <div className="space-y-4">
                <Label className="block mb-1">Custom Widget Size</Label>
                <div>
                  <Label className="block mb-1">Width (pixels)</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      min={300}
                      max={380}
                      step={5}
                      value={[appearance.chatSize?.width ?? 380]}
                      onValueChange={([value]) =>
                        onUpdate({
                          chatSize: {
                            ...appearance.chatSize,
                            width: value,
                          },
                        })
                      }
                      className="flex-1"
                    />
                    <span className="w-14 text-right text-muted-foreground">
                      {appearance.chatSize?.width ?? 380}px
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="block mb-1">Height (pixels)</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      min={400}
                      max={600}
                      step={10}
                      value={[appearance.chatSize?.height ?? 600]}
                      onValueChange={([value]) =>
                        onUpdate({
                          chatSize: {
                            ...appearance.chatSize,
                            height: value,
                          },
                        })
                      }
                      className="flex-1"
                    />
                    <span className="w-14 text-right text-muted-foreground">
                      {appearance.chatSize?.height ?? 600}px
                    </span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Agent Avatar</Label>
                <p className="text-sm text-muted-foreground">
                  Display agent avatars in the chat
                </p>
              </div>
              <Switch
                checked={appearance.showAgentAvatar}
                onCheckedChange={(checked) =>
                  onUpdate({ showAgentAvatar: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Company Logo</Label>
                <p className="text-sm text-muted-foreground">
                  Display your company logo in the widget
                </p>
              </div>
              <Switch
                checked={appearance.showCompanyLogo}
                onCheckedChange={(checked) =>
                  onUpdate({ showCompanyLogo: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Company Logo URL</Label>
              <Input
                id="logo"
                value={appearance.logo || ""}
                onChange={(e) => onUpdate({ logo: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="customCSS">Custom CSS</Label>
              <textarea
                id="customCSS"
                value={appearance.customCSS || ""}
                onChange={(e) => onUpdate({ customCSS: e.target.value })}
                placeholder=""
                className="w-full h-32 p-3 border rounded-md font-mono text-sm"
              />
            </div> */}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
