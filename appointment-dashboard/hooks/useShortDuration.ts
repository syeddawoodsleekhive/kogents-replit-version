import { useEffect, useState } from "react";
import moment from "moment";
import { useSelector } from "react-redux";

export const useShortDuration = (createdAt?: Date) => {
  const serverTimeOffset = useSelector(
    (state: RootReducerState) => state.chat.serverTimeOffset
  );

  const [durationText, setDurationText] = useState("");

  useEffect(() => {
    if (!createdAt) return;

    const update = () => {
      const now = moment();
      const duration = moment.duration(
        now.add(serverTimeOffset, "ms").diff(moment(createdAt))
      );

      if (duration.asSeconds() < 60)
        setDurationText(`${Math.floor(duration.asSeconds())}s`);
      else if (duration.asMinutes() < 60)
        setDurationText(`${Math.floor(duration.asMinutes())}m`);
      else if (duration.asHours() < 24)
        setDurationText(`${Math.floor(duration.asHours())}h`);
      else if (duration.asDays() < 7)
        setDurationText(`${Math.floor(duration.asDays())}d`);
      else if (duration.asWeeks() < 4)
        setDurationText(`${Math.floor(duration.asWeeks())}w`);
      else if (duration.asMonths() < 12)
        setDurationText(`${Math.floor(duration.asMonths())}mo`);
      else setDurationText(`${Math.floor(duration.asYears())}y`);
    };

    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [createdAt, serverTimeOffset]);

  return durationText;
};
