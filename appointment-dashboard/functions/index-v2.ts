import moment from "moment";

export const getToken = () => {
  let token = "";
  if (typeof window !== "undefined") {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith("token=")) {
        token = cookie.substring("token=".length, cookie.length);
        break;
      }
    }
  }
  return token;
};

export const getReferrerData = (visitor: any) => {
  const referrer = visitor?.referrerData;
  if (!referrer)
    return {
      label: "Direct Traffic",
      referrerLink: "",
      trafficSource: "Direct Traffic",
      isDirect: true,
      withoutGclid: "",
    };

  const trafficSource = referrer?.trafficSource;
  const isDirect = trafficSource?.type === "direct" && !trafficSource?.source;

  const withoutGclid =
    referrer?.referrer?.referrer ||
    referrer?.referrer?.currentUrl ||
    referrer?.referrer?.landingPage;

  const label = isDirect ? "Direct Traffic" : trafficSource?.source || "-";

  const referrerLink = referrer?.referrer?.referrer?.includes("gclid")
    ? referrer?.referrer?.referrer
    : referrer?.referrer?.currentUrl?.includes("gclid")
    ? referrer?.referrer?.currentUrl
    : referrer?.referrer?.landingPage?.includes("gclid")
    ? referrer?.referrer?.landingPage
    : withoutGclid || "";

  return {
    label,
    referrerLink,
    trafficSource,
    isDirect,
    withoutGclid,
  };
};

export const formatTime = (date: Date | string) => {
  try {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("formatTime error:", error);
    return "--:--";
  }
};

export const formatPassTime = (date: Date) => {
  const dateObject = moment(date);
  const now = moment();
  const yesterday = now.clone().subtract(1, "day");

  if (dateObject.isSame(now, "day")) {
    return dateObject.format("h:mm A");
  } else if (dateObject.isSame(yesterday, "day")) {
    return `Yesterday, ${dateObject.format("h:mm A")}`;
  } else if (dateObject.isSame(now, "year")) {
    return dateObject.format("MMM DD, h:mm A");
  } else {
    return dateObject.format("h:mm A, DD MMMM YYYY");
  }
};

// unused functions
// export const handleDownloadImage = (attachment: any, toast: any) => {
//   if (attachment.url) {
//     const link = document.createElement("a");
//     link.href = attachment.url;
//     link.download = attachment.name;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     toast({
//       title: "Image downloaded!",
//       description: `Your image has been downloaded successfully.`,
//       variant: "default",
//     });
//   } else {
//     toast({
//       title: "Error downloading image!",
//       description: `There was an error downloading your image.`,
//       variant: "destructive",
//     });
//   }
// };
