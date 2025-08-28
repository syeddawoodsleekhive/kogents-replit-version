import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WidgetContent, WidgetSettings } from "@/types/widget";
import React from "react";

interface IOfflineChatFormProps {
  settings: WidgetSettings;
}

const OfflineChatForm = ({ settings }: IOfflineChatFormProps) => {
  return (
    <>
      <form className="flex flex-col justify-between w-full h-full">
        {/* <div className="flex flex-col space-y-2"> */}
        <div className="flex flex-col space-y-4 px-5 py-4 overflow-y-auto h-[47dvh]">
          <p className="text-gray-400 text-sm">
            {settings.content.offlineChatForm.greetingsMessage}
          </p>
          {/* Text or Email Field */}
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col space-y-2">
              <Label>Name</Label>
              <Input
                type="text"
                // value={settings.content.placeholderText}
                // onChange={(e) =>
                //   updateContent({ placeholderText: e.target.value })
                // }
                placeholder="Enter your name"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                // value={settings.content.placeholderText}
                // onChange={(e) =>
                //   updateContent({ placeholderText: e.target.value })
                // }
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <Label className="flex items-center gap-1">
              Phone Number
              {!settings.content.offlineChatForm.isPhoneRequired && (
                <span className="text-xs">(optional)</span>
              )}
            </Label>
            <Input
              type="number"
              // value={settings.content.placeholderText}
              // onChange={(e) =>
              //   updateContent({ placeholderText: e.target.value })
              // }
              placeholder="Enter your email"
            />
          </div>

          {/* Textarea */}
          <div className="flex flex-col space-y-2">
            <Label>Question </Label>
            <textarea
              rows={4}
              name=""
              className="w-full border rounded-md p-3"
              placeholder="Please enter your query here..."
            />
          </div>
        </div>

        {/* <div className="w-full flex justify-end"> */}
        <div className="w-full flex justify-end bg-white py-4 px-5 shadow-[0_-4px_8px_-4px_rgba(0,0,0,0.12)]">
          <button
            className="px-2 py-1 text-white rounded-lg hover:opacity-70 cursor-pointer text-sm"
            style={{
              backgroundColor: settings.appearance.primaryColor,
            }}
            type="submit"
          >
            Send Message
          </button>
        </div>
      </form>
    </>
  );
};

export default OfflineChatForm;
