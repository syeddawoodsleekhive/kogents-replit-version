"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Test page for widget embed fingerprinting
 * Tests fingerprinting within iframe context
 */

export default function WidgetEmbedTestPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "widget:fingerprint-result") {
        console.log("Received fingerprint from widget:", event.data)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  const requestFingerprint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "parent:request-fingerprint",
        },
        "*",
      )
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Widget Embed Fingerprinting Test</h1>
        <p className="text-muted-foreground">Test fingerprinting within iframe context</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Embedded Widget Test</CardTitle>
            <CardDescription>Widget running in iframe with fingerprinting capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <button
                onClick={requestFingerprint}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Request Fingerprint from Widget
              </button>

              <div className="border rounded-lg overflow-hidden">
                <iframe
                  ref={iframeRef}
                  src="/widget?embedded=true&test=true"
                  width="100%"
                  height="600"
                  data-testid="chat-widget-iframe"
                  className="border-0"
                  title="Chat Widget"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
