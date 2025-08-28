"use client";

import { WidgetAppearanceModel } from "@/types/appearance";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "../chat-header";
import { cn } from "@/lib/utils";

interface IOfflineChatFormProps {
  settings: WidgetAppearanceModel | null;
  headerOptions: any;
  isOpen: boolean;
  isFullScreen: boolean;
}

const ARIA_CLEAR_DELAY = 1200;

export default function OfflineChatForm({
  settings,
  headerOptions,
  isOpen,
  isFullScreen,
}: IOfflineChatFormProps) {
  const [ariaAnnouncement, setAriaAnnouncement] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  /** Announce form load & focus first field */
  useEffect(() => {
    setAriaAnnouncement(
      "Offline chat form loaded. Please fill out the required fields."
    );
    requestAnimationFrame(() => firstFieldRef.current?.focus());
  }, []);

  /** Debounce ARIA live region updates */
  useEffect(() => {
    if (!ariaAnnouncement) return;
    const timer = setTimeout(() => setAriaAnnouncement(""), ARIA_CLEAR_DELAY);
    return () => clearTimeout(timer);
  }, [ariaAnnouncement]);

  /** Focus trap (keep tab inside form) */
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
    const isOptionalPhone =
      name === "phone" && !settings?.forms.offlineChatForm.requirePhone;
    if (required && !isOptionalPhone && !value) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "This field is required.",
      }));
      setAriaAnnouncement(`Validation error: ${name} is required.`);
    } else {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  /** Handle form submission */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle form submission logic (API call)
    setAriaAnnouncement("Form submitted successfully.");
  };

  return (
    <>
      {/* Screen reader live region */}
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

        <form
          ref={formRef}
          className={cn(
            "flex flex-col justify-between w-full",
            isFullScreen ? "h-full" : "h-[31rem]"
          )}
          onSubmit={handleSubmit}
        >
          <div
            className={cn("flex flex-col space-y-4 px-5 py-4 overflow-auto")}
          >
            {/* Greeting */}
            <p className="text-gray-400 text-sm">
              {settings?.forms.offlineChatForm.offlineChatGreeting ||
                "Sorry we aren't online at the moment. Leave a message and we will get back to you."}
            </p>

            {/* Input fields (Name, Email, Phone, Question) */}
            {[
              {
                label: "Name",
                id: "offline-name",
                type: "text",
                required: true,
              },
              {
                label: "Email",
                id: "offline-email",
                type: "email",
                required: true,
              },
              {
                label: "Phone Number",
                id: "offline-phone",
                type: "number",
                required: settings?.forms.offlineChatForm.requirePhone,
                optional: !settings?.forms.offlineChatForm.requirePhone,
              },
            ].map((field) => (
              <div key={field.id} className="flex flex-col space-y-2">
                <label
                  htmlFor={field.id}
                  className="text-sm font-medium flex items-center gap-1"
                >
                  {field.label}
                  {field.optional && (
                    <span className="text-xs">(optional)</span>
                  )}
                </label>
                <input
                  ref={field.id === "offline-name" ? firstFieldRef : undefined}
                  id={field.id}
                  name={field.id.split("-")[1]}
                  type={field.type}
                  required={field.required}
                  className="border border-gray-300 rounded-md p-2 px-3 placeholder:text-gray-600"
                  placeholder={`Enter your ${field.label.toLowerCase()}`}
                  aria-describedby={
                    fieldErrors[field.id.split("-")[1]]
                      ? `${field.id}-error`
                      : undefined
                  }
                  aria-invalid={!!fieldErrors[field.id.split("-")[1]]}
                  onBlur={handleFieldBlur}
                  tabIndex={0}
                />
                {fieldErrors[field.id.split("-")[1]] && (
                  <span
                    id={`${field.id}-error`}
                    className="text-xs text-red-500"
                  >
                    {fieldErrors[field.id.split("-")[1]]}
                  </span>
                )}
              </div>
            ))}

            {/* Question Field */}
            <div className="flex flex-col space-y-2">
              <label htmlFor="offline-question" className="text-sm font-medium">
                Question
              </label>
              <textarea
                id="offline-question"
                name="question"
                rows={4}
                required
                placeholder="Please enter your query here..."
                className="border border-gray-300 rounded-md p-2 px-3 placeholder:text-gray-600 resize-none"
                aria-describedby={
                  fieldErrors.question ? "question-error" : undefined
                }
                aria-invalid={!!fieldErrors.question}
                onBlur={handleFieldBlur}
                tabIndex={0}
              />
              {fieldErrors.question && (
                <span id="question-error" className="text-xs text-red-500">
                  {fieldErrors.question}
                </span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div
            className={cn(
              "w-full flex justify-end items-center",
              "bg-white px-5",
              isFullScreen ? "border-t-0 pb-4" : "border-t pt-4"
            )}
          >
            <button
              className="px-2 py-1 text-white rounded-lg hover:opacity-70 cursor-pointer text-sm"
              style={{
                backgroundColor:
                  settings?.appearance.colors.primary || "#3b82f6",
              }}
              type="submit"
              tabIndex={0}
              aria-label="Send Message"
            >
              Send Message
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
