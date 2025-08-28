"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Code, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WidgetIntegration, WidgetSettings } from "@/types/widget";
import { Switch } from "../ui/switch";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

interface WidgetCodeGeneratorProps {
  settings: WidgetSettings;
  onGenerateCode: () => string;
  onUpdate: (integration: Partial<WidgetIntegration>) => void;
}

export function WidgetCodeGenerator({
  settings,
  onGenerateCode,
  onUpdate,
}: WidgetCodeGeneratorProps) {
  const { toast } = useToast();
  const [customDomain, setCustomDomain] = React.useState("");

  const router = useRouter();

  const embedCode = React.useMemo(() => onGenerateCode(), [onGenerateCode]);

  const reactCode = `import { AppointmentHubWidget } from '@appointmenthub/react-widget';

function App() {
  return (
    <div>
      {/* Your app content */}
      <AppointmentHubWidget
        widgetId="${settings.id}"
        apiKey="${settings.integration.apiKey}"
        config={{
          theme: "${settings.appearance.theme}",
          position: "${settings.appearance.position}",
          primaryColor: "${settings.appearance.primaryColor}",
        }}
      />
    </div>
  );
}`;

  const wordpressCode = `<?php
// Add this to your theme's functions.php file
function add_appointmenthub_widget() {
    ?>
    <script>
      (function() {
        var script = document.createElement('script');
        script.src = 'https://widget.appointmenthub.com/widget.js';
        script.setAttribute('data-widget-id', '${settings.id}');
        script.setAttribute('data-api-key', '${settings.integration.apiKey}');
        document.head.appendChild(script);
      })();
    </script>
    <?php
}
add_action('wp_footer', 'add_appointmenthub_widget');
?>`;

  const shopifyCode = `<!-- Add this to your theme.liquid file before </body> -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://widget.appointmenthub.com/widget.js';
    script.setAttribute('data-widget-id', '${settings.id}');
    script.setAttribute('data-api-key', '${settings.integration.apiKey}');
    document.head.appendChild(script);
  })();
</script>`;

  const { workspace: workSpaceObj, user: userData, logout } = useUser();
  const workspace = workSpaceObj?.slug;

  const copyToClipboard = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied!",
      description: `${type} code has been copied to your clipboard.`,
    });
  };

  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Widget Installation
        </CardTitle>
        <CardDescription>
          Copy and paste the code below to add the chat widget to your website
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Widget Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Widget Status</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable the chat widget on your website
              </p>
            </div>
            <Switch
              checked={settings.integration.widgetStatus}
              onCheckedChange={(checked) => onUpdate({ widgetStatus: checked })}
            />
          </div>

          {/* Domain Configuration */}
          {/* <div className="space-y-4">
            <Label>Allowed Domains</Label>
            <div className="flex gap-2">
              <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="example.com" />
              <Button
                variant="outline"
                onClick={() => {
                  if (customDomain && !settings.integration.allowedDomains.includes(customDomain)) {
                    // This would typically update the settings
                    setCustomDomain("")
                    toast({
                      title: "Domain added",
                      description: `${customDomain} has been added to allowed domains.`,
                    })
                  }
                }}
              >
                Add Domain
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.integration.allowedDomains.map((domain) => (
                <Badge key={domain} variant="outline">
                  {domain}
                </Badge>
              ))}
            </div>
          </div> */}

          {/* Installation Codes */}
          <Tabs defaultValue="html" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="react">React</TabsTrigger>
              {/* <TabsTrigger value="wordpress">WordPress</TabsTrigger> */}
              {/* <TabsTrigger value="shopify">Shopify</TabsTrigger> */}
            </TabsList>

            <TabsContent value="html" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>HTML Embed Code</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(embedCode, "HTML")}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadCode(embedCode, "widget-embed.html")
                      }
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{embedCode}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="react" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>React Component</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(reactCode, "React")}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadCode(reactCode, "widget-component.jsx")
                      }
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{reactCode}</code>
                </pre>
              </div>
            </TabsContent>

            {/* <TabsContent value="wordpress" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>WordPress Integration</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(wordpressCode, "WordPress")}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadCode(wordpressCode, "widget-wordpress.php")}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{wordpressCode}</code>
                </pre>
              </div>
            </TabsContent> */}
            {/* 
            <TabsContent value="shopify" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Shopify Integration</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(shopifyCode, "Shopify")}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadCode(shopifyCode, "widget-shopify.liquid")}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{shopifyCode}</code>
                </pre>
              </div>
            </TabsContent> */}
          </Tabs>

          {/* Testing */}
          <div className="space-y-4">
            <Label>Test Your Widget</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => router.push(`/${workspace}/test-widget`)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Test Page
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                <Code className="w-4 h-4 mr-2" />
                Debug Console
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
