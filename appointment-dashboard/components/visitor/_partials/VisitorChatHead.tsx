import { BrowserIcon, CountryFlag, DeviceIcon } from "@/components/common";
import { UserIcon } from "@/icons";
import { Button } from "@/components/ui/button";
import { Minus, X } from "lucide-react";
import ActionButton from "./ActionButton";

interface ChatHeadProps {
  roomDetails: conversationSessionType;
  visitorName: string;
  confirmClose: boolean;
  handleMinimize: () => void;
  onCloseHandler: () => void;
  setActionModal: (action: actionModalType) => void;
}

const VisitorChatHead = ({
  roomDetails,
  visitorName,
  confirmClose,
  handleMinimize,
  onCloseHandler,
  setActionModal,
}: ChatHeadProps) => {
  return (
    <div className="bg-black text-white w-full h-12 flex justify-between items-center px-3 border-b">
      <div className="flex items-center gap-2">
        <div
          className="text-white h-7 w-7 rounded flex items-center justify-center"
          style={{ background: `#${roomDetails.visitorId.slice(0, 6)}` }}
        >
          <UserIcon width={20} />
        </div>
        <div>
          <span className="font-medium">{visitorName}</span>
        </div>

        {roomDetails.visitorSessionDetails?.location && (
          <div className="flex items-center">
            <CountryFlag
              countryKey={
                roomDetails.visitorSessionDetails.location?.countryKey
              }
            />
          </div>
        )}

        <div className="flex items-center">
          <DeviceIcon visitor={roomDetails.visitorSessionDetails} />
        </div>

        <div className="flex items-center">
          <BrowserIcon visitor={roomDetails.visitorSessionDetails} />
        </div>
      </div>

      {!confirmClose && (
        <div className="flex items-center">
          <ActionButton setShowAction={setActionModal} />
          <Button
            variant="ghost"
            className="h-5 w-5 p-0 text-white hover:bg-transparent cursor-default"
          ></Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMinimize}
            className="h-5 w-5 p-0 text-white hover:bg-gray-700 hover:text-white"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCloseHandler()}
            className="h-5 w-5 p-0 text-red-500  hover:text-white hover:bg-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default VisitorChatHead;
