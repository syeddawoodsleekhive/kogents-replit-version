import { useRef, useCallback, useState, useEffect } from "react";
import { SoundTypes } from "@/types/sound";

export interface PlaySoundOptions {
  type?: SoundTypes;
}

export function isMobileOrTablet() {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod|Tablet|Mobile/i.test(
    navigator.userAgent
  );
}

export function playNotificationSound({
  type = "alert",
  soundEnabled = true,
  hapticEnabled = true,
  soundVolume = 1,
  audioContext,
}: {
  type?: SoundTypes;
  soundEnabled?: boolean;
  hapticEnabled?: boolean;
  soundVolume?: number;
  audioContext?: AudioContext;
}) {
  if (!soundEnabled || !audioContext) return;
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    switch (type) {
      case "message":
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(830, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          500,
          audioContext.currentTime + 0.1
        );
        gainNode.gain.setValueAtTime(
          soundVolume * 0.2,
          audioContext.currentTime
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.2
        );
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
      case "notification":
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(750, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          900,
          audioContext.currentTime + 0.1
        );
        oscillator.frequency.exponentialRampToValueAtTime(
          700,
          audioContext.currentTime + 0.2
        );
        gainNode.gain.setValueAtTime(
          soundVolume * 0.15,
          audioContext.currentTime
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3
        );
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case "alert":
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        oscillator1.type = "square";
        oscillator1.frequency.setValueAtTime(950, audioContext.currentTime);
        gainNode1.gain.setValueAtTime(
          soundVolume * 0.1,
          audioContext.currentTime
        );
        gainNode1.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.15
        );
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);
        oscillator1.start();
        oscillator1.stop(audioContext.currentTime + 0.15);
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        oscillator2.type = "square";
        oscillator2.frequency.setValueAtTime(
          850,
          audioContext.currentTime + 0.2
        );
        gainNode2.gain.setValueAtTime(
          soundVolume * 0.1,
          audioContext.currentTime + 0.2
        );
        gainNode2.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.35
        );
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        oscillator2.start(audioContext.currentTime + 0.2);
        oscillator2.stop(audioContext.currentTime + 0.35);
        break;
      default:
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(830, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          500,
          audioContext.currentTime + 0.1
        );
        gainNode.gain.setValueAtTime(
          soundVolume * 0.2,
          audioContext.currentTime
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.2
        );
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    }
    if (hapticEnabled && "vibrate" in navigator && isMobileOrTablet()) {
      try {
        switch (type) {
          case "message":
            navigator.vibrate(80);
            break;
          case "notification":
            navigator.vibrate([40, 30, 40]);
            break;
          case "alert":
            navigator.vibrate([60, 50, 60, 50, 60]);
            break;
          default:
            navigator.vibrate(80);
        }
      } catch (e) {
        console.error("Vibration failed:", e);
      }
    }
  } catch (e) {
    console.error("Failed to play sound:", e);
  }
}

// React hook for notification sound
export function useNotificationSound() {
  const audioContext = useRef<AudioContext | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(1);
  const [currentSoundType, setCurrentSoundType] = useState<SoundTypes>("alert");

  // Lazy initialize AudioContext
  const getAudioContext = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return audioContext.current;
  };

  // Initialize audio context after user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContext.current) {
        try {
          audioContext.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
          console.log("Audio context initialized");
        } catch (e) {
          console.error("Failed to create audio context:", e);
        }
      }
    };
    // Listen for user interaction events
    window.addEventListener("click", initAudio, { once: true });
    window.addEventListener("keydown", initAudio, { once: true });
    return () => {
      window.removeEventListener("click", initAudio);
      window.removeEventListener("keydown", initAudio);
    };
  }, []);

  const play = useCallback(
    (type?: SoundTypes) => {
      playNotificationSound({
        type: type || currentSoundType,
        soundEnabled,
        hapticEnabled,
        soundVolume,
        audioContext: getAudioContext(),
      });
    },
    [soundEnabled, hapticEnabled, soundVolume, currentSoundType]
  );

  return {
    play,
    setSoundEnabled,
    setHapticEnabled,
    setSoundVolume,
    setCurrentSoundType,
    soundEnabled,
    hapticEnabled,
    soundVolume,
    currentSoundType,
    audioContext,
  };
}
