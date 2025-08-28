"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { WidgetBehavior } from "@/types/widget";
import { Separator } from "../ui/separator";

interface WidgetBehaviorEditorProps {
  behavior: WidgetBehavior;
  updateBehavior: (behavior: Partial<WidgetBehavior>) => void;
}

export function WidgetBehaviorEditor({
  behavior,
  updateBehavior,
}: WidgetBehaviorEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Behavior</CardTitle>
        <CardDescription>
          Configure when and how your widget appears to visitors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto Open */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Open Widget</Label>
              <p className="text-sm text-muted-foreground">
                Automatically open the chat widget for new visitors
              </p>
            </div>
            <Switch
              checked={behavior.autoOpen}
              onCheckedChange={(checked) =>
                updateBehavior({ autoOpen: checked })
              }
            />
          </div>
          {behavior.autoOpen && (
            <div className="space-y-2">
              <Label>Auto Open Delay (seconds)</Label>
              <Input
                type="number"
                value={behavior.autoOpenDelay / 1000}
                onChange={(e) =>
                  updateBehavior({
                    autoOpenDelay: Number.parseInt(e.target.value) * 1000,
                  })
                }
                min="0"
                max="60"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Auto-minimize Settings */}
        <div className="space-y-4 border-gray-200">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Minimize Widget</Label>
              <p className="text-sm text-muted-foreground">
                Automatically minimize the chat widget
              </p>
            </div>

            <Switch
              id="auto-minimize-toggle"
              checked={behavior.autoMinimize.enabled}
              onCheckedChange={(checked) =>
                updateBehavior({
                  autoMinimize: {
                    ...behavior.autoMinimize,
                    enabled: checked,
                  },
                })
              }
              aria-label="Toggle auto-minimize"
            />
          </div>
          {behavior.autoMinimize.enabled && (
            <div
              className={
                behavior.autoMinimize.enabled
                  ? "opacity-100"
                  : "opacity-50 pointer-events-none"
              }
            >
              <div className="mb-2 flex justify-between">
                <Label htmlFor="auto-minimize-timeout">
                  Inactivity timeout (minutes)
                </Label>
                <span className="text-sm text-gray-500">
                  {behavior.autoMinimize.timeout / 60000} min
                </span>
              </div>
              <Slider
                id="auto-minimize-timeout"
                value={[behavior.autoMinimize.timeout / 60000]}
                min={0.5}
                max={10}
                step={0.5}
                onValueChange={([value]) =>
                  updateBehavior({
                    autoMinimize: {
                      ...behavior.autoMinimize,
                      timeout: value * 60000,
                    },
                  })
                }
                aria-label="Auto-minimize timeout"
              />
              <p className="text-xs text-gray-500 mt-1">
                Chat will minimize after {behavior.autoMinimize.timeout / 60000}{" "}
                {behavior.autoMinimize.timeout / 60000 === 1 ? "minute" : "minutes"} of
                inactivity
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Private Chat */}
        {/* <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Proactive Chat</Label>
              <p className="text-sm text-muted-foreground">
                Send automatic messages to engage visitors
              </p>
            </div>
            <Switch
              checked={behavior.proactiveChat.enabled}
              onCheckedChange={(checked) =>
                updateBehavior({
                  proactiveChat: {
                    ...behavior.proactiveChat,
                    enabled: checked,
                  },
                })
              }
            />
          </div>
          {behavior.proactiveChat.enabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Proactive Message</Label>
                <Input
                  value={behavior.proactiveChat.message}
                  onChange={(e) =>
                    updateBehavior({
                      proactiveChat: {
                        ...behavior.proactiveChat,
                        message: e.target.value,
                      },
                    })
                  }
                  placeholder="Hi! How can we help you today?"
                />
              </div>
              <div className="space-y-2">
                <Label>Delay (seconds)</Label>
                <Input
                  type="number"
                  value={behavior.proactiveChat.delay / 1000}
                  onChange={(e) =>
                    updateBehavior({
                      proactiveChat: {
                        ...behavior.proactiveChat,
                        delay: Number.parseInt(e.target.value) * 1000,
                      },
                    })
                  }
                  min="5"
                  max="300"
                />
              </div>
            </div>
          )}
        </div>

        <Separator /> */}

        {/* Offline Mode */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Offline Mode</Label>
              <p className="text-sm text-muted-foreground">
                Handle messages when agents are unavailable
              </p>
            </div>
            <Switch
              checked={behavior.offlineMode.enabled}
              onCheckedChange={(checked) =>
                updateBehavior({
                  offlineMode: {
                    ...behavior.offlineMode,
                    enabled: checked,
                  },
                })
              }
            />
          </div>
          {behavior.offlineMode.enabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Offline Message</Label>
                <Input
                  value={behavior.offlineMode.message}
                  onChange={(e) =>
                    updateBehavior({
                      offlineMode: {
                        ...behavior.offlineMode,
                        message: e.target.value,
                      },
                    })
                  }
                  placeholder="We're currently offline. Please leave a message!"
                />
              </div>
              {/* <div className="flex items-center justify-between">
                <Label>Collect Email Address</Label>
                <Switch
                  checked={behavior.offlineMode.collectEmail}
                  onCheckedChange={(checked) =>
                    updateBehavior({
                      offlineMode: {
                        ...behavior.offlineMode,
                        collectEmail: checked,
                      },
                    })
                  }
                />
              </div> */}
            </div>
          )}
        </div>

        <Separator />

        {/* Image Compression Settings */}
        {/* <div className="space-y-4">
          <Label className="mb-3">Image Compression</Label>

          <div className="flex items-center justify-between">
            <span className="text-sm">Enable compression</span>
            <Switch
              checked={behavior.imageCompression.enabled}
              onCheckedChange={(checked) =>
                updateBehavior({
                  imageCompression: {
                    ...behavior.imageCompression,
                    enabled: checked,
                  },
                })
              }
            />
          </div>

          {behavior.imageCompression.enabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="image-size">Max size (MB)</Label>
                  <span className="text-xs text-gray-500">
                    {behavior.imageCompression.size} MB
                  </span>
                </div>
                <Slider
                  id="image-size"
                  value={[behavior.imageCompression.size]}
                  min={0.1}
                  max={5}
                  step={0.1}
                  onValueChange={([value]) =>
                    updateBehavior({
                      imageCompression: {
                        ...behavior.imageCompression,
                        size: value,
                      },
                    })
                  }
                  aria-label="Image-Size"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="image-quality">Quality</Label>
                  <span className="text-xs text-gray-500">
                    {behavior.imageCompression.quality}%
                  </span>
                </div>
                <Slider
                  id="image-quality"
                  value={[behavior.imageCompression.quality]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={([value]) =>
                    updateBehavior({
                      imageCompression: {
                        ...behavior.imageCompression,
                        quality: value,
                      },
                    })
                  }
                  aria-label="Image-Quality"
                />
                <div className="text-sm text-muted-foreground">
                  Images larger than the max size will be compressed to reduce
                  upload time and bandwidth usage.
                </div>
              </div>
            </div>
          )}
        </div> */}

        {/* <Separator /> */}

        {/* Reduce Animations */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="reduce-animations-toggle">Reduce Animations</Label>
            <Switch
              id="reduce-animations-toggle"
              checked={behavior.reduceAnimations}
              onCheckedChange={(checked) =>
                updateBehavior({ reduceAnimations: checked })
              }
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Minimizes motion effects for users sensitive to movement
          </p>
        </div>

        {/* Screen Reader Optimizations */}
        {/* <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="screen-reader-toggle">
              Screen Reader Optimizations
            </Label>
            <Switch
              id="screen-reader-toggle"
              checked={behavior.screenReaderOptimization}
              onCheckedChange={(checked) =>
                updateBehavior({ screenReaderOptimization: checked })
              }
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Enhances compatibility with screen readers and assistive
            technologies
          </p>
        </div> */}
      </CardContent>
    </Card>
  );
}
