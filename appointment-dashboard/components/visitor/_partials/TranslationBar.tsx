import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";

const TranslationBar = ({
  visitor,
  setActionModal,
}: {
  visitor: conversationSessionType;
  setActionModal: (action: actionModalType) => void;
}) => {
  const {
    isTranslating,
    detectedLanguage,
    targetLanguage,
    setTargetLanguage,
    error: translationError,
    isLoading: translationLoading,
    startTranslation,
    stopTranslation,
    clearError: clearTranslationError,
  } = useTranslation();
  return (
    <div className="bg-gray-100 border-t border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side: Translation icon and language selector */}
        <div className="flex items-center space-x-3">
          {/* Translation Icon - Two overlapping squares */}
          <div className="flex items-center">
            {/* Background square with Chinese character */}
            <div className="w-5 h-5 -mt-4 bg-gray-600 rounded-sm relative flex items-center justify-center">
              <span className="text-white text-xs font-bold ">文</span>
            </div>
            {/* Front overlapping square with Latin letter */}
            <div className="w-5 h-5 bg-gray-700 rounded-sm -ml-2 relative z-10 flex items-center justify-center justify-items-center">
              <span className="text-white text-xs font-bold ">A</span>
            </div>
          </div>

          {/* Language text and dropdown */}
          <span className="text-sm text-gray-700">
            {isTranslating
              ? `Translating from ${detectedLanguage}`
              : "Detected language"}
          </span>

          <Select
            value={detectedLanguage}
            onValueChange={(value) => {
              // Note: detectedLanguage is now managed by the hook
              // This will be updated when translation starts
            }}
          >
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Spanish">Spanish</SelectItem>
              <SelectItem value="French">French</SelectItem>
              <SelectItem value="German">German</SelectItem>
              <SelectItem value="Italian">Italian</SelectItem>
              <SelectItem value="Portuguese">Portuguese</SelectItem>
              <SelectItem value="Russian">Russian</SelectItem>
              <SelectItem value="Japanese">Japanese</SelectItem>
              <SelectItem value="Korean">Korean</SelectItem>
              <SelectItem value="Chinese">Chinese</SelectItem>
              <SelectItem value="Arabic">Arabic</SelectItem>
              <SelectItem value="Hindi">Hindi</SelectItem>
            </SelectContent>
          </Select>

          {/* Target Language Selector */}
          <span className="text-sm text-gray-700">to</span>

          <Select
            value={targetLanguage}
            onValueChange={(value) => setTargetLanguage(value)}
          >
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Spanish">Spanish</SelectItem>
              <SelectItem value="French">French</SelectItem>
              <SelectItem value="German">German</SelectItem>
              <SelectItem value="Italian">Italian</SelectItem>
              <SelectItem value="Portuguese">Portuguese</SelectItem>
              <SelectItem value="Russian">Russian</SelectItem>
              <SelectItem value="Japanese">Japanese</SelectItem>
              <SelectItem value="Korean">Korean</SelectItem>
              <SelectItem value="Chinese">Chinese</SelectItem>
              <SelectItem value="Arabic">Arabic</SelectItem>
              <SelectItem value="Hindi">Hindi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right side: Buttons and branding */}
        <div className="flex items-center space-x-3">
          {/* Error Display */}
          {translationError && (
            <div className="text-red-500 text-sm bg-red-50 px-2 py-1 rounded">
              {translationError}
              <button
                onClick={clearTranslationError}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                x
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {translationLoading && (
            <div className="text-blue-500 text-sm bg-blue-50 px-2 py-1 rounded">
              Translating...
            </div>
          )}

          {!isTranslating ? (
            <>
              {/* Translate Button */}
              <Button
                onClick={() => startTranslation(visitor?.messages || [])}
                className="px-4 py-1.5 text-sm"
                size={"sm"}
                disabled={translationLoading}
              >
                {translationLoading ? "Translating..." : "Translate"}
              </Button>

              {/* Dismiss Button */}
              <Button
                variant="outline"
                onClick={() => setActionModal("")}
                size={"sm"}
                className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
              >
                Dismiss
              </Button>
            </>
          ) : (
            /* Stop Translating Button */
            <Button
              variant="outline"
              onClick={() => stopTranslation()}
              size={"sm"}
              className="px-4 py-1.5 text-sm bg-gray-200 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-300"
              disabled={translationLoading}
            >
              Stop translating
            </Button>
          )}

          {/* Google Translate Branding */}
          <div className="flex items-center space-x-1">
            <div className="flex items-center space-x-0.5">
              <span className="text-blue-500 text-sm font-bold">G</span>
              <span className="text-red-500 text-sm font-bold">o</span>
              <span className="text-yellow-500 text-sm font-bold">o</span>
              <span className="text-blue-500 text-sm font-bold">g</span>
              <span className="text-green-500 text-sm font-bold">l</span>
              <span className="text-red-500 text-sm font-bold">e</span>
            </div>
            <span className="text-gray-500 text-sm">Translate</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationBar;
