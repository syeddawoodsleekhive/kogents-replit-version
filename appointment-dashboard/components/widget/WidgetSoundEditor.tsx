"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useNotificationSound } from "@/hooks/usePlaySound";
import type { WidgetAppearance, WidgetSound } from "@/types/widget";
import { Smartphone, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

export interface WidgetSoundSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  soundVolume: number;
  currentSoundType: string;
}

interface WidgetSoundEditorProps {
  sound: WidgetSound;
  onUpdate: (settings: Partial<WidgetSound>) => void;
}

export default function WidgetSoundEditor({
  sound,
  onUpdate,
}: WidgetSoundEditorProps) {
  const { soundEnabled, hapticEnabled, soundVolume, currentSoundType } = sound;
  const [tempVolume, setTempVolume] = useState(soundVolume);
  const { play } = useNotificationSound();
  const isVibrationSupported =
    typeof navigator !== "undefined" && "vibrate" in navigator;

  const handleVolumeChange = (value: number[]) => {
    setTempVolume(value[0]);
  };

  const handleVolumeChangeEnd = () => {
    onUpdate({ soundVolume: tempVolume });
  };

  const handleSoundTypeChange = (value: string) => {
    onUpdate({ currentSoundType: value });
    if (soundEnabled) {
      play(value as any);
    }
  };

  const testSound = () => {
    play(currentSoundType as any);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Sound Settings
        </CardTitle>
        <CardDescription>
          Control when and how sounds play in your widget.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <Label htmlFor="sound-toggle">Notification Sounds</Label>
            </div>
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={(checked) => onUpdate({ soundEnabled: checked })}
              aria-label="Toggle notification sounds"
            />
          </div>

          {soundEnabled && (
            <div className="space-y-6">
              <div
                className={
                  soundEnabled
                    ? "opacity-100"
                    : "opacity-50 pointer-events-none"
                }
              >
                <div className="mb-2 flex justify-between">
                  <Label htmlFor="volume-slider">Volume</Label>
                  <span className="text-sm text-gray-500">
                    {Math.round(tempVolume * 100)}%
                  </span>
                </div>
                <Slider
                  id="volume-slider"
                  defaultValue={[soundVolume]}
                  value={[tempVolume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  onValueCommit={handleVolumeChangeEnd}
                  aria-label="Volume"
                />
              </div>

              <div
                className={
                  soundEnabled
                    ? "opacity-100"
                    : "opacity-50 pointer-events-none"
                }
              >
                <Label className="mb-2 block">Sound Type</Label>
                <RadioGroup
                  value={currentSoundType.toLowerCase()}
                  onValueChange={handleSoundTypeChange}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="message" id="sound-message" />
                    <Label htmlFor="sound-message">Message (Soft)</Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem
                      value="notification"
                      id="sound-notification"
                    />
                    <Label htmlFor="sound-notification">
                      Notification (Medium)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="alert" id="sound-alert" />
                    <Label htmlFor="sound-alert">Alert (Sharp)</Label>
                  </div>
                </RadioGroup>

                <Button
                  onClick={testSound}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  disabled={!soundEnabled}
                >
                  Test Sound
                </Button>
              </div>
            </div>
          )}

          {/* Haptic Feedback */}
          {isVibrationSupported && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-sm text-gray-700">
                Haptic Feedback
              </h4>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone size={18} />
                  <Label htmlFor="haptic-toggle">Vibration</Label>
                </div>
                <Switch
                  id="haptic-toggle"
                  checked={hapticEnabled}
                  onCheckedChange={(checked) =>
                    onUpdate({ hapticEnabled: checked })
                  }
                  aria-label="Toggle haptic feedback"
                />
              </div>

              <p className="text-xs text-gray-500">
                Enable vibration feedback when receiving messages (mobile
                devices only)
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
