import Axios from "@/lib/axios";
import { WidgetAppearanceModel } from "@/types/appearance";

export const getWidgetSettings = (
  workspaceId: string
): Promise<WidgetAppearanceModel> => {
  return Axios.get(`/widget-appearance/workspace/${workspaceId}`)
    .then((res) => {
      if (res) {
        return res.data.data || res.data._doc;
      }
      return null;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};
