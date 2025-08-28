"use client";

import { useT } from "@/lib/i18n";
import { WidgetAppearanceModel } from "@/types/appearance";
import { X } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import ChatHeader from "../chat-header";
import { cn } from "@/lib/utils";
import ChatInput from "../chat-input";

interface IPreChatFormProps {
  settings: WidgetAppearanceModel | null;
  headerOptions: any;
  chatInputOptions: any;
  isOpen: boolean;
  onClose?: () => void;
  isFullScreen: boolean;
}

export default function PreChatForm({
  settings,
  isOpen,
  headerOptions,
  chatInputOptions,
  onClose,
  isFullScreen,
}: IPreChatFormProps) {
  const t = useT();
  const [ariaAnnouncement, setAriaAnnouncement] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ariaTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const preChatForm = settings?.forms?.preChatForm;

  /** Announce form load & focus first field */
  useEffect(() => {
    setAriaAnnouncement(t("chat.forms.preChatForm.loaded"));
    focusTimeoutRef.current = setTimeout(
      () => firstFieldRef.current?.focus(),
      0
    );

    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
        focusTimeoutRef.current = null;
      }
    };
  }, []);

  /** Debounce ARIA updates */
  useEffect(() => {
    if (!ariaAnnouncement) return;

    ariaTimeoutRef.current = setTimeout(() => setAriaAnnouncement(""), 1200);

    return () => {
      if (ariaTimeoutRef.current) {
        clearTimeout(ariaTimeoutRef.current);
        ariaTimeoutRef.current = null;
      }
    };
  }, [ariaAnnouncement]);

  /** Focus trap */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !formRef.current) return;
      const focusable = Array.from(
        formRef.current.querySelectorAll<HTMLElement>("input, textarea, button")
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

      if (!focusable.length) return;

      const active = document.activeElement;
      if (e.shiftKey && active === focusable[0]) {
        e.preventDefault();
        focusable[focusable.length - 1]?.focus();
      } else if (!e.shiftKey && active === focusable[focusable.length - 1]) {
        e.preventDefault();
        focusable[0]?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  /** Validate fields on blur */
  const handleFieldBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, required } = e.target;
    if (required && !value) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: t("chat.errors.fieldRequired"),
      }));
      setAriaAnnouncement(
        `${t("chat.errors.validationError")}: ${name} is required.`
      );
    } else {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  /** Validate all fields on submit */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    let hasErrors = false;
    const errors: { [key: string]: string } = {};

    form
      .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea"
      )
      .forEach((field) => {
        if (field.required && !formData.get(field.name)) {
          errors[field.name] = t("chat.errors.fieldRequired");
          hasErrors = true;
        }
      });

    setFieldErrors(errors);
    if (hasErrors) {
      setAriaAnnouncement(t("chat.errors.fillAllFields"));
      return;
    }

    setAriaAnnouncement("Pre-chat form submitted successfully.");
    // TODO: Handle submission (API call or state update)
  };

  return (
    <>
      {/* Live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(1px, 1px, 1px, 1px)",
        }}
      >
        {ariaAnnouncement}
      </div>

      {/* Form container */}
      <div
        className={cn(
          "bg-white shadow-lg flex flex-col relative",
          isOpen
            ? isFullScreen
              ? "w-screen h-screen max-h-[100vh] opacity-100"
              : "opacity-100 h-[calc(100vh-2rem)] w-[calc(100vw-2rem)]"
            : "pointer-events-none",
          !isFullScreen && "rounded-lg"
        )}
        aria-hidden={!isOpen}
        style={{ borderRadius: settings?.appearance.borderRadius }}
      >
        <ChatHeader {...headerOptions} />

        {/* Pre-chat form */}
        <form
          ref={formRef}
          className="flex flex-col w-full h-full"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col space-y-4 px-5 py-4">
            <p className="text-gray-400 text-sm flex items-center justify-between">
              {preChatForm?.preChatGreeting ||
                t("chat.forms.preChatForm.greeting")}
              {!preChatForm?.required && (
                <X
                  className="cursor-pointer text-gray-500 hover:text-gray-700"
                  size={16}
                  onClick={onClose}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && onClose?.()}
                  aria-label="Close pre-chat form"
                />
              )}
            </p>

            {/* Name */}
            <FieldInput
              ref={firstFieldRef}
              id="prechat-name"
              name="name"
              type="text"
              required={preChatForm?.requireIdentity}
              label={t("chat.forms.preChatForm.name")}
              placeholder={t("chat.forms.preChatForm.enterName")}
              error={fieldErrors.name}
              onBlur={handleFieldBlur}
              optional={!preChatForm?.requireIdentity}
              t={t}
            />

            {/* Email */}
            <FieldInput
              id="prechat-email"
              name="email"
              type="email"
              required={preChatForm?.requireIdentity}
              label={t("chat.forms.preChatForm.email")}
              placeholder={t("chat.forms.preChatForm.enterEmail")}
              error={fieldErrors.email}
              onBlur={handleFieldBlur}
              optional={!preChatForm?.requireIdentity}
              t={t}
            />

            {/* Phone */}
            <FieldInput
              id="prechat-phone"
              name="phone"
              type="number"
              required={preChatForm?.requirePhone}
              label={t("chat.forms.preChatForm.phone")}
              placeholder={t("chat.forms.preChatForm.enterPhone")}
              error={fieldErrors.phone}
              onBlur={handleFieldBlur}
              optional={!preChatForm?.requirePhone}
              t={t}
            />

            {/* Question */}
            <FieldTextarea
              id="prechat-question"
              name="question"
              required={preChatForm?.requireQuestion}
              label={t("chat.forms.preChatForm.question")}
              placeholder={t("chat.forms.preChatForm.enterQuery")}
              error={fieldErrors.question}
              onBlur={handleFieldBlur}
              optional={!preChatForm?.requireQuestion}
              t={t}
            />
          </div>

          {/* Submit */}
          <div className="w-full flex justify-end bg-white px-5 pb-2">
            <button
              className="px-2 py-1 text-white rounded-lg hover:opacity-70 cursor-pointer text-sm"
              style={{
                backgroundColor:
                  settings?.appearance.colors.primary || "#3b82f6",
              }}
              type="submit"
            >
              {t("chat.forms.preChatForm.sendMessage")}
            </button>
          </div>
        </form>

        {/* Pre-chat chat input */}
        <ChatInput {...chatInputOptions} isPreChatForm />
      </div>
    </>
  );
}

/** Reusable Field Components */
const FieldInput = React.forwardRef<HTMLInputElement, any>(
  (
    {
      id,
      name,
      type,
      required,
      label,
      placeholder,
      error,
      onBlur,
      optional,
      t,
    },
    ref
  ) => (
    <div className="flex flex-col space-y-2">
      <label
        htmlFor={id}
        className="flex items-center gap-1 text-sm font-medium"
      >
        {label}{" "}
        {optional && (
          <span className="text-xs">
            {t("chat.forms.preChatForm.optional")}
          </span>
        )}
      </label>
      <input
        ref={ref}
        id={id}
        name={name}
        type={type}
        required={required}
        className="border border-gray-300 rounded-md p-2 px-3 placeholder:text-gray-600"
        placeholder={placeholder}
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={!!error}
        onBlur={onBlur}
      />
      {error && (
        <span id={`${name}-error`} className="text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  )
);

const FieldTextarea = ({
  id,
  name,
  required,
  label,
  placeholder,
  error,
  onBlur,
  optional,
  t,
}: any) => (
  <div className="flex flex-col space-y-2">
    <label htmlFor={id} className="flex items-center gap-1 text-sm font-medium">
      {label}{" "}
      {optional && (
        <span className="text-xs">{t("chat.forms.preChatForm.optional")}</span>
      )}
    </label>
    <textarea
      id={id}
      name={name}
      rows={4}
      required={required}
      placeholder={placeholder}
      className="border border-gray-300 rounded-md p-2 px-3 placeholder:text-gray-600 resize-none"
      aria-describedby={error ? `${name}-error` : undefined}
      aria-invalid={!!error}
      onBlur={onBlur}
    />
    {error && (
      <span id={`${name}-error`} className="text-xs text-red-500">
        {error}
      </span>
    )}
  </div>
);
