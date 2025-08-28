"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { TriggerCondition } from "@/types/triggers";
import { triggerFields, operatorLabels } from "@/utils/triggerUtils";

interface TriggerConditionBuilderProps {
  condition: TriggerCondition;
  onChange: (updates: Partial<TriggerCondition>) => void;
  showLogicalOperator?: boolean;
}

export function TriggerConditionBuilder({
  condition,
  onChange,
  showLogicalOperator,
}: TriggerConditionBuilderProps) {
  const fieldDef = triggerFields.find((f) => f.field === condition.field);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Field Selection */}
          <div className="space-y-2">
            <Label>Field</Label>
            <Select
              value={condition.field}
              onValueChange={(value) =>
                onChange({
                  field: value as any,
                  operator: "contains",
                  value: "",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {triggerFields.map((field) => (
                  <SelectItem key={field.field} value={field.field}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldDef?.description && (
              <p className="text-xs text-muted-foreground">
                {fieldDef.description}
              </p>
            )}
          </div>

          {/* Operator Selection */}
          <div className="space-y-2">
            <Label>Operator</Label>
            <Select
              value={condition.operator}
              onValueChange={(value) => onChange({ operator: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldDef?.operators.map((operator: any) => (
                  <SelectItem key={operator} value={operator}>
                    {operatorLabels[operator] || operator}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value Input */}
          {condition.operator !== "is_empty" &&
            condition.operator !== "is_not_empty" && (
              <div className="space-y-2">
                <Label>Value</Label>
                {fieldDef?.type === "select" && fieldDef.options ? (
                  <Select
                    value={condition.value?.toString()}
                    onValueChange={(value) => onChange({ value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldDef.options.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : fieldDef?.type === "number" ? (
                  <Input
                    type="number"
                    value={condition.value?.toString() || ""}
                    onChange={(e) =>
                      onChange({ value: Number(e.target.value) || 0 })
                    }
                    placeholder={fieldDef.placeholder}
                  />
                ) : (
                  <Input
                    value={condition.value?.toString() || ""}
                    onChange={(e) => onChange({ value: e.target.value })}
                    placeholder={fieldDef?.placeholder || "Enter value"}
                  />
                )}
              </div>
            )}
        </div>

        {/* Logical Operator */}
        {showLogicalOperator && (
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Then</Label>
              <Select
                value={condition.logicalOperator || "AND"}
                onValueChange={(value: "AND" | "OR") =>
                  onChange({ logicalOperator: value })
                }
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
