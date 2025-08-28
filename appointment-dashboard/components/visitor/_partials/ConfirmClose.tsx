import { Button } from "@/components/ui/button";
import { useCallback } from "react";

interface ConfirmCloseProps {
  onCloseHandler: (quit?: boolean) => void;
  joinedChat: boolean;
  setConfirmClose: (value: boolean) => void;
}

const ConfirmClose = ({
  onCloseHandler,
  joinedChat,
  setConfirmClose,
}: ConfirmCloseProps) => {
  const handleClose = useCallback(() => {
    onCloseHandler(true);
  }, [onCloseHandler]);

  const handleCancel = useCallback(() => {
    setConfirmClose(false);
  }, [setConfirmClose]);

  return (
    <div className="absolute left-0 right-0 top-0 z-50 bottom-0 bg-white flex">
      <div className="m-auto text-gray-500 text-center">
        <h1 className="text-lg">End chat?</h1>
        <p className="pb-2 my-3 text-sm">
          To minimize this chat instead, click the minimize button
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={handleClose} disabled={!joinedChat}>
            End chat
          </Button>
          <Button
            className="bg-gray-200 text-black hover:bg-gray-200 hover:text-black"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmClose;
