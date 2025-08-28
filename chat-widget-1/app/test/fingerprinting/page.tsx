"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"


import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateDeviceFingerprint } from "@/utils/device-fingerprinting"
import { DeviceFingerprint } from "@/types/chat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Test page for manual fingerprinting validation across browsers
 * This page can be opened in different browsers to test fingerprinting behavior
 */

interface TestResult {
  fingerprint: DeviceFingerprint | null
  generated: boolean
  duration: number
  error: string | null
  timestamp: string
}

export default function FingerprintingTestPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [browserInfo, setBrowserInfo] = useState<any>(null)

  useEffect(() => {
    // Collect browser information
    setBrowserInfo({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints,
      doNotTrack: navigator.doNotTrack,
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        pixelRatio: window.devicePixelRatio,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
  }, [])

  const runFingerprintTest = async () => {
    setIsGenerating(true)
    setProgress(0)
    setTestResult(null)

    const startTime = performance.now()

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90))
    }, 200)

    try {
      const fingerprint = await generateDeviceFingerprint(true, {
        enableCanvas: true,
        enableWebGL: true,
        enableAudio: true,
        enableFonts: true,
        enableBattery: true,
        enableWebRTC: true,
        enablePlugins: true,
        enableMediaDevices: true,
        timeout: 10000,
        respectPrivacy: false,
      })

      const endTime = performance.now()

      setTestResult({
        fingerprint,
        generated: !!fingerprint,
        duration: endTime - startTime,
        error: null,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      const endTime = performance.now()

      setTestResult({
        fingerprint: null,
        generated: false,
        duration: endTime - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    } finally {
      clearInterval(progressInterval)
      setProgress(100)
      setIsGenerating(false)
    }
  }

  const downloadResults = () => {
    if (!testResult) return

    const data = {
      testResult,
      browserInfo,
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fingerprint-test-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copySignature = () => {
    if (testResult?.fingerprint?.metadata?.signature) {
      navigator.clipboard.writeText(testResult.fingerprint.metadata.signature)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Device Fingerprinting Test</h1>
        <p className="text-muted-foreground">Test device fingerprinting across different browsers and devices</p>
      </div>

      <div className="grid gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Fingerprint Test</CardTitle>
            <CardDescription>Generate a device fingerprint to test browser compatibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={runFingerprintTest} disabled={isGenerating} className="min-w-[150px]">
                {isGenerating ? "Generating..." : "Generate Fingerprint"}
              </Button>

              {testResult && (
                <>
                  <Button variant="outline" onClick={downloadResults}>
                    Download Results
                  </Button>
                  <Button variant="outline" onClick={copySignature}>
                    Copy Signature
                  </Button>
                </>
              )}
            </div>

            {isGenerating && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">Collecting device characteristics...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Test Results
                {/* <Badge variant={testResult.generated ? "default" : "destructive"}>
                  {testResult.generated ? "Success" : "Failed"}
                </Badge> */}
                <p>
                  {testResult.generated ? "Success" : "Failed"}
                </p>
              </CardTitle>
              <CardDescription>Generated on {new Date(testResult.timestamp).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="raw">Raw Data</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{testResult.generated ? "✓" : "✗"}</div>
                      <div className="text-sm text-muted-foreground">Generated</div>
                    </div>

                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{testResult.fingerprint?.metadata?.confidence || 0}%</div>
                      <div className="text-sm text-muted-foreground">Confidence</div>
                    </div>

                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{testResult.duration.toFixed(0)}ms</div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                    </div>

                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{testResult.fingerprint?.metadata?.errors?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Errors</div>
                    </div>
                  </div>

                  {testResult.fingerprint?.metadata?.signature && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fingerprint Signature:</label>
                      <div className="p-3 bg-muted rounded font-mono text-sm break-all">
                        {testResult.fingerprint.metadata.signature}
                      </div>
                    </div>
                  )}

                  {testResult.error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <h4 className="font-medium text-destructive mb-2">Error:</h4>
                      <p className="text-sm">{testResult.error}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="features" className="space-y-4">
                  {testResult.fingerprint && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries({
                        Canvas: !!testResult.fingerprint.canvas,
                        WebGL: !!testResult.fingerprint.webgl,
                        Audio: !!testResult.fingerprint.audio,
                        Fonts: !!testResult.fingerprint.fonts,
                        Battery: !!testResult.fingerprint.battery,
                        WebRTC: !!testResult.fingerprint.webrtc,
                        Plugins: !!testResult.fingerprint.plugins,
                        "Media Devices": !!testResult.fingerprint.mediaDevices,
                      }).map(([feature, available]) => (
                        <div key={feature} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm font-medium">{feature}</span>
                          {/* <Badge variant={available ? "default" : "secondary"}>
                            {available ? "Available" : "Unavailable"}
                          </Badge> */}
                          <p>
                            {available ? "Available" : "Unavailable"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  {testResult.fingerprint && (
                    <div className="space-y-6">
                      {/* Screen Information */}
                      {testResult.fingerprint.screen && (
                        <div>
                          <h4 className="font-medium mb-2">Screen Information</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            <div>
                              Resolution: {testResult.fingerprint.screen.width}×{testResult.fingerprint.screen.height}
                            </div>
                            <div>
                              Available: {testResult.fingerprint.screen.availWidth}×
                              {testResult.fingerprint.screen.availHeight}
                            </div>
                            <div>Color Depth: {testResult.fingerprint.screen.colorDepth}-bit</div>
                            <div>Pixel Ratio: {testResult.fingerprint.screen.pixelRatio}</div>
                            <div>Touch Support: {testResult.fingerprint.screen.touchSupport ? "Yes" : "No"}</div>
                            <div>Orientation: {testResult.fingerprint.screen.orientation}</div>
                          </div>
                        </div>
                      )}

                      {/* Hardware Information */}
                      {testResult.fingerprint.hardware && (
                        <div>
                          <h4 className="font-medium mb-2">Hardware Information</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            <div>CPU Cores: {testResult.fingerprint.hardware.concurrency}</div>
                            <div>Memory: {testResult.fingerprint.hardware.memory}GB</div>
                            <div>Platform: {testResult.fingerprint.hardware.platform}</div>
                            <div>Architecture: {testResult.fingerprint.hardware.architecture}</div>
                            <div>Max Touch Points: {testResult.fingerprint.hardware.maxTouchPoints}</div>
                          </div>
                        </div>
                      )}

                      {/* WebGL Information */}
                      {testResult.fingerprint.webgl && (
                        <div>
                          <h4 className="font-medium mb-2">WebGL Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>Renderer: {testResult.fingerprint.webgl.renderer}</div>
                            <div>Vendor: {testResult.fingerprint.webgl.vendor}</div>
                            <div>Version: {testResult.fingerprint.webgl.version}</div>
                            <div>Extensions: {testResult.fingerprint.webgl.extensions?.length || 0}</div>
                          </div>
                        </div>
                      )}

                      {/* Audio Information */}
                      {testResult.fingerprint.audio && (
                        <div>
                          <h4 className="font-medium mb-2">Audio Information</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            <div>Sample Rate: {testResult.fingerprint.audio.sampleRate}Hz</div>
                            <div>Max Channels: {testResult.fingerprint.audio.maxChannelCount}</div>
                            <div>Channel Count: {testResult.fingerprint.audio.channelCount}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="raw" className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(testResult, null, 2)}</pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Browser Information */}
        {browserInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Browser Information</CardTitle>
              <CardDescription>Current browser and device characteristics</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="browser" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="browser">Browser</TabsTrigger>
                  <TabsTrigger value="screen">Screen</TabsTrigger>
                  <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                </TabsList>

                <TabsContent value="browser" className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>User Agent:</strong> {browserInfo.userAgent}
                    </div>
                    <div>
                      <strong>Platform:</strong> {browserInfo.platform}
                    </div>
                    <div>
                      <strong>Language:</strong> {browserInfo.language}
                    </div>
                    <div>
                      <strong>Languages:</strong> {browserInfo.languages?.join(", ")}
                    </div>
                    <div>
                      <strong>Timezone:</strong> {browserInfo.timezone}
                    </div>
                    <div>
                      <strong>Online:</strong> {browserInfo.onLine ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Cookies Enabled:</strong> {browserInfo.cookieEnabled ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Do Not Track:</strong> {browserInfo.doNotTrack || "Not set"}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="screen" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Screen Size:</strong> {browserInfo.screen.width}×{browserInfo.screen.height}
                    </div>
                    <div>
                      <strong>Available Size:</strong> {browserInfo.screen.availWidth}×{browserInfo.screen.availHeight}
                    </div>
                    <div>
                      <strong>Viewport Size:</strong> {browserInfo.viewport.width}×{browserInfo.viewport.height}
                    </div>
                    <div>
                      <strong>Color Depth:</strong> {browserInfo.screen.colorDepth}-bit
                    </div>
                    <div>
                      <strong>Pixel Depth:</strong> {browserInfo.screen.pixelDepth}-bit
                    </div>
                    <div>
                      <strong>Pixel Ratio:</strong> {browserInfo.screen.pixelRatio}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="capabilities" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>CPU Cores:</strong> {browserInfo.hardwareConcurrency || "Unknown"}
                    </div>
                    <div>
                      <strong>Device Memory:</strong>{" "}
                      {browserInfo.deviceMemory ? `${browserInfo.deviceMemory}GB` : "Unknown"}
                    </div>
                    <div>
                      <strong>Max Touch Points:</strong> {browserInfo.maxTouchPoints}
                    </div>
                    <div>
                      <strong>Touch Support:</strong> {"ontouchstart" in window ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>WebGL Support:</strong> {(() => {
                        const canvas = document.createElement("canvas")
                        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
                        return gl ? "Yes" : "No"
                      })()}
                    </div>
                    <div>
                      <strong>Audio Context:</strong>{" "}
                      {window.AudioContext || (window as any).webkitAudioContext ? "Yes" : "No"}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
