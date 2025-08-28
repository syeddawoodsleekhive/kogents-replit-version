"use client";

import { WidgetAppearanceModel } from "@/types/appearance";
import { X } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import ChatHeader from "../chat-header";
import { cn } from "@/lib/utils";

interface IPostChatFormProps {
  settings: WidgetAppearanceModel | null;
  headerOptions: any;
  isOpen: boolean;
  onClose?: () => void;
  isFullScreen: boolean;
}

export default function PostChatForm({
  settings,
  headerOptions,
  isOpen,
  onClose,
  isFullScreen,
}: IPostChatFormProps) {
  const [ariaAnnouncement, setAriaAnnouncement] = useState("");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ariaTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const postChatForm = settings?.forms?.postChatForm;

  /** Announce form load & focus first field */
  useEffect(() => {
    setAriaAnnouncement("Post-chat form loaded. Please provide your feedback and rating.");
    focusTimeoutRef.current = setTimeout(() => firstFieldRef.current?.focus(), 0);

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

  /** Trap focus within form */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !formRef.current) return;
      const focusable = Array.from(
        formRef.current.querySelectorAll<HTMLElement>("button, textarea")
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
  const handleFieldBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const { name, value, required } = e.target;
    if (required && !value) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "This field is required.",
      }));
      setAriaAnnouncement(`Validation error: ${name} is required.`);
    } else {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  /** Handle rating */
  const handleRating = (star: number) => {
    setRating(star);
    setAriaAnnouncement(`Rated ${star} star${star > 1 ? "s" : ""}.`);
    // Clear rating error if it exists
    if (fieldErrors.rating) {
      setFieldErrors((prev) => ({ ...prev, rating: "" }));
    }
  };

  /** Handle feedback */
  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(e.target.value);
    // Clear feedback error if it exists
    if (fieldErrors.feedback) {
      setFieldErrors((prev) => ({ ...prev, feedback: "" }));
    }
  };

  /** Validate all fields on submit */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasErrors = false;
    const errors: { [key: string]: string } = {};

    // Validate rating if required
    if (postChatForm?.requireRating && rating === 0) {
      errors.rating = "Please provide a rating.";
      hasErrors = true;
    }

    // Validate feedback if required
    if (postChatForm?.requireFeedback && !feedback.trim()) {
      errors.feedback = "Please provide feedback.";
      hasErrors = true;
    }

    setFieldErrors(errors);
    if (hasErrors) {
      setAriaAnnouncement("Please fill all required fields before submitting.");
      return;
    }

    setSubmitted(true);
    setAriaAnnouncement("Feedback submitted. Thank you!");
    // TODO: API call
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

        {/* Post-chat form */}
        <form
          ref={formRef}
          className="flex flex-col w-full h-full justify-between pb-5"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col space-y-6 px-5 py-4">
            <p className="text-gray-400 text-sm flex items-center justify-between">
              {postChatForm?.postChatGreeting || "Thank you for your feedback!"}
              {!postChatForm?.required && (
                <X
                  className="cursor-pointer text-gray-500 hover:text-gray-700"
                  size={16}
                  onClick={onClose}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && onClose?.()}
                  aria-label="Close post-chat form"
                />
              )}
            </p>

            {/* Rating */}
            <div className="flex flex-col space-y-2">
              <label htmlFor="postchat-rating" className="flex items-center gap-1 text-sm font-medium">
                Rating
                {!postChatForm?.requireRating && <span className="text-xs">(optional)</span>}
              </label>
              <div
                className="flex items-center gap-1"
                id="postchat-rating"
                role="radiogroup"
                aria-label="Rate the chat"
                aria-describedby={fieldErrors.rating ? "rating-error" : undefined}
                aria-invalid={!!fieldErrors.rating}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    ref={star === 1 ? firstFieldRef : undefined}
                    type="button"
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    aria-checked={rating === star}
                    role="radio"
                    tabIndex={rating === star ? 0 : -1}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                    onClick={() => handleRating(star)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill={star <= rating ? settings?.appearance.colors.primary || '#3b82f6' : "#e5e7eb"}
                      viewBox="0 0 20 20"
                      className="w-6 h-6"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                    </svg>
                  </button>
                ))}
              </div>
              {fieldErrors.rating && (
                <span id="rating-error" className="text-xs text-red-500">
                  {fieldErrors.rating}
                </span>
              )}
            </div>

            {/* Feedback */}
            <div className="flex flex-col space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium">
                Feedback
                {!postChatForm?.requireFeedback && <span className="text-xs">(optional)</span>}
              </label>
              <textarea
                name="feedback"
                rows={4}
                required={postChatForm?.requireFeedback}
                className="border border-gray-300 rounded-md p-2 px-3 placeholder:text-gray-600 resize-none"
                placeholder="Please enter your feedback here..."
                value={feedback}
                onChange={handleFeedbackChange}
                onBlur={handleFieldBlur}
                aria-describedby={fieldErrors.feedback ? "feedback-error" : undefined}
                aria-invalid={!!fieldErrors.feedback}
              />
              {fieldErrors.feedback && (
                <span id="feedback-error" className="text-xs text-red-500">
                  {fieldErrors.feedback}
                </span>
              )}
            </div>

            
          </div>

          {/* Submit */}
          <div className="w-full flex justify-end bg-white px-5 pb-2">
            <button
              className="px-2 py-1 text-white rounded-lg hover:opacity-70 cursor-pointer text-sm"
              style={{
                backgroundColor: settings?.appearance.colors.primary || "#3b82f6",
              }}
              type="submit"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
