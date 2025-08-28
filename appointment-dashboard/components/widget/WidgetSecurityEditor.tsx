"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WidgetSecurity, WidgetSettings } from "@/types/widget";
import { FormInput } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "../ui/badge";
import { X } from "lucide-react";
import { useState } from "react";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "@/lib/utils";

interface WidgetSecurityEditorProps {
  settings: WidgetSettings;
  onSecurityUpdate: (security: Partial<WidgetSecurity>) => void;
}

export function WidgetSecurityEditor({
  settings,
  onSecurityUpdate,
}: WidgetSecurityEditorProps) {
  const [customDomain, setCustomDomain] = useState("");
  const [allowedDomains, setAllowedDomains] = useState<string[]>(
    settings.security.allowedDomains || []
  );
  const { toast } = useToast();
  // Example country list, replace with your actual country data source if needed
  const countryOptions = [
    { label: "United States", value: "US" },
    { label: "United Kingdom", value: "GB" },
    { label: "Canada", value: "CA" },
    { label: "India", value: "IN" },
    { label: "Germany", value: "DE" },
    { label: "France", value: "FR" },
    { label: "Australia", value: "AU" },
    { label: "Pakistan", value: "PK" },
    { label: "China", value: "CN" },
    { label: "Japan", value: "JP" },
    // ...add more as needed
  ];
  const [bannedCountries, setBannedCountries] = useState<string[]>(
    settings.security.bannedCountries || []
  );
  const [selectedCountry, setSelectedCountry] = useState("");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Security</CardTitle>
        <CardDescription>
          Manage security settings to protect your chat widget.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Domain Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allowed Domains</Label>
                <p className="text-sm text-muted-foreground">
                  List the domains where the widget should be displayed
                </p>
              </div>
              <Switch
                checked={settings.security.isDomainsAllowed}
                onCheckedChange={(checked) =>
                  onSecurityUpdate({ isDomainsAllowed: checked })
                }
              />
            </div>
            {settings.security.isDomainsAllowed && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="example.com"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const trimmedDomain = customDomain.trim();
                      if (
                        trimmedDomain &&
                        !allowedDomains.includes(trimmedDomain)
                      ) {
                        const updatedDomains = [
                          ...allowedDomains,
                          trimmedDomain,
                        ];
                        setAllowedDomains(updatedDomains);
                        setCustomDomain("");
                        toast({
                          title: "Domain added",
                          description: `${trimmedDomain} has been added to allowed domains.`,
                        });
                        onSecurityUpdate({ allowedDomains: updatedDomains });
                      }
                    }}
                  >
                    Add Domain
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allowedDomains.map((domain) => (
                    <span
                      key={domain}
                      className="inline-flex items-center px-2 py-1 rounded-xl border text-sm"
                    >
                      <span className="mr-1">{domain}</span>
                      <button
                        type="button"
                        className="ml-1 p-0.5 rounded hover:bg-gray-100 transition-colors"
                        aria-label={`Remove ${domain}`}
                        onClick={() => {
                          const updated = allowedDomains.filter(
                            (d) => d !== domain
                          );
                          setAllowedDomains(updated);
                          toast({
                            title: "Domain removed",
                            description: `${domain} has been removed from allowed domains.`,
                          });
                          onSecurityUpdate({ allowedDomains: updated });
                        }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Separator />
          {/* Blocked Countries  */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Blocked Countries</Label>
                <p className="text-sm text-muted-foreground">
                  Select countries to block one at a time. Selected countries
                  will be shown below.
                </p>
              </div>
              <Switch
                checked={settings.security.isBannedCountries}
                onCheckedChange={(checked) =>
                  onSecurityUpdate({ isBannedCountries: checked })
                }
              />
            </div>
            {settings.security.isBannedCountries && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Select
                    value={selectedCountry}
                    onValueChange={(value) => setSelectedCountry(value)}
                  >
                    <SelectTrigger
                      className={cn(
                        "border rounded px-2 py-2",
                        "text-sm text-[#737373] w-full",
                        "focus:ring-0 focus:ring-offset-0"
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions
                        .filter((c) => !bannedCountries.includes(c.value))
                        .map((country) => (
                          <SelectItem
                            key={country.value}
                            className="text-sm"
                            value={country.value}
                          >
                            {country.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (
                        selectedCountry &&
                        !bannedCountries.includes(selectedCountry)
                      ) {
                        const updated = [...bannedCountries, selectedCountry];
                        setBannedCountries(updated);
                        setSelectedCountry("");
                        toast({
                          title: "Country blocked",
                          description: `${
                            countryOptions.find(
                              (c) => c.value === selectedCountry
                            )?.label || selectedCountry
                          } has been blocked.`,
                        });
                        onSecurityUpdate({ bannedCountries: updated });
                      }
                    }}
                    disabled={!selectedCountry}
                  >
                    Block Country
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bannedCountries.map((code) => {
                    const country = countryOptions.find(
                      (c) => c.value === code
                    );
                    return (
                      <span
                        key={code}
                        className="inline-flex items-center bg-[#0a0a0a] px-2 py-1 rounded-xl text-xs text-white"
                      >
                        <span className="mr-1">
                          {country ? country.label : code}
                        </span>
                        <button
                          type="button"
                          className="ml-1 p-0.5 rounded hover:bg-zinc-800 text-white transition-colors"
                          aria-label={`Remove ${
                            country ? country.label : code
                          }`}
                          onClick={() => {
                            const updated = bannedCountries.filter(
                              (c) => c !== code
                            );
                            setBannedCountries(updated);
                            toast({
                              title: "Country unblocked",
                              description: `${
                                country ? country.label : code
                              } has been removed from blocked countries.`,
                            });
                            onSecurityUpdate({ bannedCountries: updated });
                          }}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
