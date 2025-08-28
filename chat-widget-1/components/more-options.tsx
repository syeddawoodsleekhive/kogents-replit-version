import {
  FileText,
  Volume2,
  VolumeX,
  Camera,
} from "lucide-react";
import { useEffect } from "react";

type eventClickType = (e: React.MouseEvent) => void;

type moreOptionsType = {
  toggleSoundHandler: eventClickType;
  toggleTranscript: eventClickType;
  soundEnabled: boolean;
  onClose: () => void;
  parentRef: React.RefObject<HTMLButtonElement | null>;
  onCameraClick?: () => void;
  showCameraOption?: boolean;
};

const MoreOptions = ({
  toggleSoundHandler,
  toggleTranscript,
  soundEnabled,
  onClose,
  parentRef,
  onCameraClick,
  showCameraOption = false,
}: moreOptionsType) => {
  const moreOptionsList = [
    {
      onClick: toggleSoundHandler,
      text: "Sound",
      icon: soundEnabled ? Volume2 : VolumeX,
    },
    {
      onClick: toggleTranscript,
      text: "Email transcript",
      icon: FileText,
    },
    {
      onClick: toggleTranscript,
      text: "Edit contact details",
      icon: FileText,
    },
    {
      onClick: toggleTranscript,
      text: "End chat",
      icon: FileText,
    },
  ];

  // Add camera option if available
  if (showCameraOption && onCameraClick) {
    moreOptionsList.unshift({
      onClick: onCameraClick,
      text: "Camera",
      icon: Camera,
    });
  }

  const onClickHandler = (e: React.MouseEvent, onClick: eventClickType) => {
    onClose();
    onClick(e);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        parentRef.current &&
        !parentRef.current.contains(event.target as Node)
      ) {
        console.log("closing");
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, parentRef]);

  return (
    <div className="absolute text-black right-0 bottom-full bg-white shadow-lg border border-gray-200 py-2 rounded-md min-w-48 z-50">
      <ul className="flex flex-col">
        {moreOptionsList.map((item, index) => (
          <li
            key={index}
            onClick={(e) => onClickHandler(e, item.onClick)}
            className="flex items-center justify-between gap-3 text-sm py-2 px-4 w-full text-nowrap hover:bg-gray-50 cursor-pointer transition-colors duration-150"
            aria-label={item.text}
          >
            <span className="text-gray-700">{item.text}</span>
            {item.text === "Sound" && (
              <item.icon size={16} className="text-gray-500" />
            )}
            {item.text === "Camera" && (
              <item.icon size={16} className="text-gray-500" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MoreOptions;
