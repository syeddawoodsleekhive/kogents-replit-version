"use client";

import { WidgetAppearanceModel } from "@/types/appearance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Check, X } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import React, { useState } from "react";

interface UserInfoField {
  id: string;
  type: "text" | "email" | "textarea" | "select" | "checkbox";
  label: string;
  placeholder?: string;
  options?: string[];
}

interface IUserInfoFormSettings {
  enabled: boolean;
  required: boolean;
  fields: UserInfoField[];
}

interface IPreChatFormProps {
  settings: WidgetAppearanceModel & {
    forms: {
      userInfoForm: IUserInfoFormSettings;
    };
  } | null;
  onClose: () => void;
}

const UserInfoChatForm = ({ settings, onClose }: IPreChatFormProps) => {
  // Return nothing if user info form is disabled
  if (!settings?.forms.userInfoForm.enabled) return null;

  // Controlled form state
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const handleChange = (id: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted user info:", formValues);
    // TODO: handle submission logic (API call etc.)
  };

  return (
    <>
      {/* Overlay container */}
      <div
        style={{
          borderRadius: "var(--border-radius)",
        }}
        className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-md"
      >
        {/* Close button (only if form is not required) */}
        {!settings?.forms.userInfoForm.required && (
          <X
            className="cursor-pointer text-slate-100 hover:text-slate-200 absolute top-2 right-2"
            size={20}
            onClick={onClose}
            aria-label="Close user info form"
          />
        )}

        {/* Main Form Container */}
        <div
          className="relative w-full max-w-xs sm:max-w-sm md:max-w-md bg-white shadow-lg p-6 flex flex-col items-center transform transition-all duration-300"
          style={{
            backgroundColor: settings?.appearance.colors.background,
            fontFamily: settings?.appearance.fontFamily,
            color: settings?.appearance.colors.text,
          }}
        >
          {/* Title */}
          <h4
            className="mb-4 text-lg font-semibold"
            style={{ color: settings?.appearance.colors.primary }}
          >
            User Info
          </h4>

          {/* Form */}
          <form
            className="flex flex-col w-full space-y-3"
            style={{ fontFamily: settings?.appearance.fontFamily }}
            onSubmit={handleSubmit}
          >
            {/* Dynamic Fields */}
            <div className="max-h-[60dvh] min-h-[40dvh] overflow-y-auto space-y-2">
              {(settings?.forms.userInfoForm.fields ?? []).map((field, index) => (
                <div key={index} className="flex flex-col">
                  {/* Text & Email Fields */}
                  {(field.type === "text" || field.type === "email") && (
                    <div className="flex flex-col space-y-2">
                      <label htmlFor={field.id}>{field.label}</label>
                      <Input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formValues[field.id] || ""}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        aria-required={settings.forms.userInfoForm.required}
                        style={{
                          backgroundColor: settings?.appearance.colors.background,
                          color: settings?.appearance.colors.text,
                          borderColor: settings?.appearance.colors.primary,
                          fontFamily: settings?.appearance.fontFamily,
                        }}
                      />
                    </div>
                  )}

                  {/* Textarea */}
                  {field.type === "textarea" && (
                    <div className="flex flex-col space-y-2">
                      <label htmlFor={field.id}>{field.label}</label>
                      <textarea
                        id={field.id}
                        rows={4}
                        className="w-full border rounded-md p-3"
                        placeholder={field.placeholder}
                        value={formValues[field.id] || ""}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        aria-required={settings.forms.userInfoForm.required}
                        style={{
                          backgroundColor: settings?.appearance.colors.background,
                          color: settings?.appearance.colors.text,
                          borderColor: settings?.appearance.colors.primary,
                          fontFamily: settings?.appearance.fontFamily,
                        }}
                      />
                    </div>
                  )}

                  {/* Select Dropdown */}
                  {field.type === "select" && (
                    <div className="space-y-2">
                      <label htmlFor={field.id}>{field.label}</label>
                      <Select
                        value={formValues[field.id] || ""}
                        onValueChange={(value) => handleChange(field.id, value)}
                      >
                        <SelectTrigger
                          style={{
                            backgroundColor: settings?.appearance.colors.background,
                            color: settings?.appearance.colors.text,
                            borderColor: settings?.appearance.colors.primary,
                            fontFamily: settings?.appearance.fontFamily,
                          }}
                        >
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-100">
                          {field.options?.map((option: string, idx: number) => (
                            <SelectItem key={idx} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Checkbox */}
                  {field.type === "checkbox" && (
                    <div className="flex items-center gap-3 relative">
                      <Input
                        id={field.id}
                        type="checkbox"
                        checked={!!formValues[field.id]}
                        onChange={(e) => handleChange(field.id, e.target.checked)}
                        className="peer appearance-none w-5 h-5 border border-gray-300 rounded bg-gray-200 checked:bg-[var(--primary-color)] checked:border-[var(--primary-color)] focus:outline-none transition-colors"
                        style={
                          {
                            "--primary-color": settings?.appearance.colors.primary,
                          } as React.CSSProperties
                        }
                      />
                      {/* Custom Checkmark Icon */}
                      <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5">
                        <Check size={16} className="hidden peer-checked:block text-white" />
                      </span>
                      <Label htmlFor={field.id} className="select-none cursor-pointer">
                        {field.label}
                      </Label>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="w-full pt-2 flex justify-between">
              <button
                className="px-3 py-1 text-black border rounded-lg hover:opacity-80 cursor-pointer text-sm"
                style={{ fontFamily: settings?.appearance.fontFamily }}
                type="button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 text-white rounded-lg hover:opacity-80 cursor-pointer text-sm"
                style={{
                  backgroundColor: settings?.appearance.colors.primary || "#3b82f6",
                  fontFamily: settings?.appearance.fontFamily,
                }}
                type="submit"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UserInfoChatForm;
