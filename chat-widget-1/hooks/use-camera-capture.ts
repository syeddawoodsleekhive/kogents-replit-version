"use client"

import { useState, useCallback, useRef } from "react"

interface CameraCapabilities {
  hasCamera: boolean
  hasFrontCamera: boolean
  hasBackCamera: boolean
  isMobile: boolean
}

interface CameraError {
  type: "permission" | "hardware" | "unknown"
  message: string
}

interface UseCameraCaptureReturn {
  capabilities: CameraCapabilities
  isCapturing: boolean
  error: CameraError | null
  captureFromCamera: (facing?: "user" | "environment") => Promise<File | null>
  requestPermissions: () => Promise<boolean>
  clearError: () => void
}

export function useCameraCapture(): UseCameraCaptureReturn {
  const [capabilities, setCapabilities] = useState<CameraCapabilities>({
    hasCamera: false,
    hasFrontCamera: false,
    hasBackCamera: false,
    isMobile: false,
  })
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<CameraError | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Detect device capabilities
  const detectCapabilities = useCallback(async () => {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent) || 
                    ('ontouchstart' in window) || 
                    (navigator.maxTouchPoints > 0)

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCapabilities({ hasCamera: false, hasFrontCamera: false, hasBackCamera: false, isMobile })
      return
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === "videoinput")

      const hasCamera = videoDevices.length > 0
      
      // Better detection of front/back cameras
      const hasFrontCamera = videoDevices.some(
        (device) => device.label.toLowerCase().includes("front") || 
                   device.label.toLowerCase().includes("user") ||
                   device.label.toLowerCase().includes("selfie")
      )
      const hasBackCamera = videoDevices.some(
        (device) => device.label.toLowerCase().includes("back") || 
                   device.label.toLowerCase().includes("environment") ||
                   device.label.toLowerCase().includes("rear") ||
                   device.label.toLowerCase().includes("main")
      )

      // If we can't determine front/back, assume first camera is back camera
      const finalHasBackCamera = hasBackCamera || (videoDevices.length > 0)
      const finalHasFrontCamera = hasFrontCamera || (videoDevices.length > 1)

      setCapabilities({
        hasCamera,
        hasFrontCamera: finalHasFrontCamera,
        hasBackCamera: finalHasBackCamera,
        isMobile,
      })
    } catch (err) {
      console.warn("Error detecting camera capabilities:", err)
      setCapabilities({ hasCamera: false, hasFrontCamera: false, hasBackCamera: false, isMobile })
    }
  }, [])

  // Request camera permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((track) => track.stop())
      await detectCapabilities()
      return true
    } catch (err) {
      const error = err as Error
      setError({
        type: error.name === "NotAllowedError" ? "permission" : "hardware",
        message:
          error.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access to capture photos."
            : "Camera not available. Please check your device settings.",
      })
      return false
    }
  }, [detectCapabilities])

  // Capture photo from camera
  const captureFromCamera = useCallback(
    async (facing: "user" | "environment" = "environment"): Promise<File | null> => {
      setIsCapturing(true)
      setError(null)

      try {
        // Get camera stream with mobile-optimized settings
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            aspectRatio: { ideal: 16/9 },
            frameRate: { ideal: 30, max: 30 }
          },
        })

        streamRef.current = stream

        // Create video element for capture
        const video = document.createElement("video")
        video.srcObject = stream
        video.autoplay = true
        video.playsInline = true
        video.muted = true // Required for autoplay on mobile

        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Video loading timeout"))
          }, 10000) // 10 second timeout

          video.onloadedmetadata = () => {
            clearTimeout(timeout)
            video.play().then(() => resolve()).catch(reject)
          }
          
          video.onerror = () => {
            clearTimeout(timeout)
            reject(new Error("Video loading failed"))
          }
        })

        // Create canvas and capture frame
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")!

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert to blob with good quality
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error("Failed to create blob"))
          }, "image/jpeg", 0.9)
        })

        // Stop stream
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null

        // Create file with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        const filename = `camera-${facing}-${timestamp}.jpg`

        return new File([blob], filename, {
          type: "image/jpeg",
          lastModified: Date.now(),
        })
      } catch (err) {
        const error = err as Error
        console.error("Camera capture error:", error)
        
        setError({
          type: error.name === "NotAllowedError" ? "permission" : "hardware",
          message:
            error.name === "NotAllowedError"
              ? "Camera permission denied. Please allow camera access in your browser settings."
              : "Failed to capture photo. Please check your camera and try again.",
        })

        // Clean up stream if it exists
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }

        return null
      } finally {
        setIsCapturing(false)
      }
    },
    [],
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Initialize capabilities on mount
  useState(() => {
    detectCapabilities()
  })

  return {
    capabilities,
    isCapturing,
    error,
    captureFromCamera,
    requestPermissions,
    clearError,
  }
}
