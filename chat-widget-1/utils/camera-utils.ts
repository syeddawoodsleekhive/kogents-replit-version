"use client"

export interface CameraConfig {
  quality: number
  maxWidth: number
  maxHeight: number
  format: "jpeg" | "webp"
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  quality: 0.9,
  maxWidth: 1920,
  maxHeight: 1080,
  format: "jpeg",
}

export const MOBILE_CAMERA_CONFIG: CameraConfig = {
  quality: 0.85,
  maxWidth: 1280,
  maxHeight: 720,
  format: "jpeg",
}

/**
 * Detect if device is mobile
 */
export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent) || 
         ('ontouchstart' in window) || 
         (navigator.maxTouchPoints > 0) ||
         (window.innerWidth <= 768)
}

/**
 * Check if camera is supported
 */
export function isCameraSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

/**
 * Get optimal camera configuration based on device
 */
export function getCameraConfig(): CameraConfig {
  return isMobileDevice() ? MOBILE_CAMERA_CONFIG : DEFAULT_CAMERA_CONFIG
}

/**
 * Format camera error messages for user display
 */
export function formatCameraError(error: { type: string; message: string }): string {
  switch (error.type) {
    case "permission":
      return "Camera access denied. Please allow camera permissions in your browser settings."
    case "hardware":
      return "Camera not available. Please check your device and try again."
    default:
      return "Camera error occurred. Please try again."
  }
}

/**
 * Check if device has multiple cameras (front/back)
 */
export async function hasMultipleCameras(): Promise<boolean> {
  if (!isCameraSupported()) return false

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices.filter((device) => device.kind === "videoinput")
    return videoDevices.length > 1
  } catch {
    return false
  }
}

/**
 * Get camera device info for debugging
 */
export async function getCameraDevices(): Promise<MediaDeviceInfo[]> {
  if (!isCameraSupported()) return []
  
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((device) => device.kind === "videoinput")
  } catch {
    return []
  }
}

/**
 * Check if device supports specific camera facing mode
 */
export async function supportsCameraFacing(facing: "user" | "environment"): Promise<boolean> {
  if (!isCameraSupported()) return false
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing }
    })
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch {
    return false
  }
}
