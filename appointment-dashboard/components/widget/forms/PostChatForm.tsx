import { Label } from "@/components/ui/label";
import { WidgetContent, WidgetSettings } from "@/types/widget";
import React from "react";

interface IPostChatFormProps {
  settings: WidgetSettings;
  onContentUpdate?: (settings: Partial<WidgetContent>) => void;
}

const PostChatForm = ({ settings, onContentUpdate }: IPostChatFormProps) => {
  return (
    <>
      <form className="flex flex-col justify-between w-full h-full">
        <div className="flex flex-col space-y-4 px-5 py-4 overflow-y-auto h-[40dvh]">
          <p className="text-gray-400 text-sm">
            {settings.content.postChatSurvey.thankYouMessage}
          </p>
          {/* Rating Stars */}
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col space-y-2">
              <Label className="flex items-center gap-1">
                Ratings
                {!settings.content.postChatSurvey.isRatingsRequired && (
                  <span className="text-xs">(optional)</span>
                )}
              </Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    onClick={() =>
                      onContentUpdate?.({
                        postChatSurvey: {
                          ...settings.content.postChatSurvey,
                          ratings: star,
                        },
                      })
                    }
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill={
                        star <= settings.content.postChatSurvey.ratings
                          ? settings.appearance.primaryColor
                          : "#e5e7eb"
                      }
                      viewBox="0 0 20 20"
                      className="w-6 h-6"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Textarea */}
          <div className="flex flex-col space-y-2">
            <Label className="flex items-center gap-1">
              Feedback
              {!settings.content.postChatSurvey.isFeedbackRequired && (
                <span className="text-xs">(optional)</span>
              )}
            </Label>
            <textarea
              rows={4}
              name=""
              value={settings.content.postChatSurvey.feedback}
              className="w-full border rounded-md p-3"
              placeholder="Please enter your query here..."
              onChange={(e) =>
                onContentUpdate?.({
                  postChatSurvey: {
                    ...settings.content.postChatSurvey,
                    feedback: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>

        <div className="w-full flex justify-end bg-white py-4 px-5 shadow-[0_-4px_8px_-4px_rgba(0,0,0,0.12)]">
          <button
            className="px-2 py-1 text-white rounded-lg hover:opacity-70 cursor-pointer text-sm"
            style={{
              backgroundColor: settings.appearance.primaryColor,
            }}
            type="submit"
          >
            Submit
          </button>
        </div>
      </form>
    </>
  );
};

export default PostChatForm;
