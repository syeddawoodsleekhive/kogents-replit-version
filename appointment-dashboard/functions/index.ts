import moment from "moment";

import { marked } from "marked";
import DOMPurify from "dompurify";
import { Message } from "@/types/visitor";

export const cleanURL = (url: string) => {
  return url.replace(/^(https?:\/\/)?(www\.)?/, "");
};

export const getToken = () => {
  let token = "";
  try {
    if (typeof window !== "undefined") {
      token = localStorage.getItem("access_token") || "";
    }
  } catch (error) {
    console.error("getToken error:", error);
  }
  return token;
};

export const setToken = (token: string) => {
  // const tokenAge = 2 * 24 * 60 * 60; // make this dynamic
  const tokenAge = 15 * 60; // make this dynamic
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
      document.cookie = `token=${token}; max-age=${tokenAge}; path=/`;
    }
  } catch (error) {
    console.error("setToken error:", error);
  }
};

export const removeToken = () => {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      // remove token from cookies
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
      document.cookie =
        "workspace=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
    }
  } catch (error) {
    console.error("removeToken error:", error);
  }
};

export const setUserData = (userData: any) => {
  // console.log("userData", userData);
  try {
    localStorage.setItem("user", JSON.stringify(userData));
  } catch (error) {
    console.error("setUserData error:", error);
  }
};

export const clearUserData = () => {
  try {
    localStorage.removeItem("user");
    localStorage.removeItem("workspace");
  } catch (error) {
    console.error("clearUserData error:", error);
  }
};

export const getUserData = async () => {
  let userData = "";
  try {
    if (typeof window !== "undefined") {
      const tempUserData = localStorage.getItem("user") || "";
      userData = JSON.parse(tempUserData);
    }
  } catch (error) {
    console.error("getUserData error:", error);
  }
  return userData;
};

export const getShortDurationUpdated = (
  createdAt?: Date,
  serverTimeOffset?: number
) => {
  try {
    if (!createdAt) return "";
    const now = moment();
    const duration = moment.duration(
      now.add(serverTimeOffset, "ms").diff(moment(createdAt))
    );
    console.log("duration", duration.asSeconds(), serverTimeOffset);
    if (duration.asSeconds() < 60)
      return `${Math.floor(duration.asSeconds())}s`;
    if (duration.asMinutes() < 60)
      return `${Math.floor(duration.asMinutes())}m`;
    if (duration.asHours() < 24) return `${Math.floor(duration.asHours())}h`;
    if (duration.asDays() < 7) return `${Math.floor(duration.asDays())}d`;
    if (duration.asWeeks() < 4) return `${Math.floor(duration.asWeeks())}w`;
    if (duration.asMonths() < 12) return `${Math.floor(duration.asMonths())}mo`;
    return `${Math.floor(duration.asYears())}y`;
  } catch (error) {
    console.error("getShortDuration error:", error);
    return "";
  }
};

export const getShortDuration = (createdAt?: Date, updatedAt?: Date) => {
  try {
    if (!createdAt || !updatedAt) return "";
    const duration = moment.duration(moment(updatedAt).diff(moment(createdAt)));
    if (duration.asSeconds() < 60)
      return `${Math.floor(duration.asSeconds())}s`;
    if (duration.asMinutes() < 60)
      return `${Math.floor(duration.asMinutes())}m`;
    if (duration.asHours() < 24) return `${Math.floor(duration.asHours())}h`;
    if (duration.asDays() < 7) return `${Math.floor(duration.asDays())}d`;
    if (duration.asWeeks() < 4) return `${Math.floor(duration.asWeeks())}w`;
    if (duration.asMonths() < 12) return `${Math.floor(duration.asMonths())}mo`;
    return `${Math.floor(duration.asYears())}y`;
  } catch (error) {
    console.error("getShortDuration error:", error);
    return "";
  }
};

const renderer = {
  link({
    href,
    title,
    text,
  }: {
    href: string;
    title?: string | null;
    text: string;
  }) {
    const t = title ? ` title="${title}"` : "";
    return `<a href="${href}" target="_blank" rel="noopener noreferrer"${t}>${text}</a>`;
  },
};

export const renderMarkdown = (content: string) => {
  marked.use({ renderer });
  const dirty = marked.parse(content.replace(/\n/g, "  \n"));
  return DOMPurify.sanitize(dirty as string, { ADD_ATTR: ["target"] });
};

export const splitChatsByVisitorLeft = (chats: Message[]) => {
  const TEN_MINUTES_MS = 10 * 60 * 1000;
  return chats.reduce((acc: Message[][], chat, index) => {
    const isVisitorLeft =
      chat.sender === "system" &&
      chat.content.toLowerCase() === "visitor has left the chat";

    if (acc.length === 0) acc.push([]);

    acc[acc.length - 1].push(chat);

    if (isVisitorLeft && index < chats.length - 1) {
      const nextChat = chats[index + 1];
      const currentTime = new Date(chat.timestamp).getTime();
      const nextTime = new Date(nextChat.timestamp).getTime();

      if (nextTime - currentTime > TEN_MINUTES_MS) {
        acc.push([]);
      }
    }

    return acc;
  }, []);
};

// export const splitChatsByVisitorLeft = (chats: Message[]) => {
//   return chats.reduce((acc: Message[][], chat, index) => {
//     const isVisitorLeft =
//       chat.sender === "system" &&
//       chat.content.toLowerCase() === "visitor has left the chat";

//     if (isVisitorLeft) {
//       if (acc.length === 0) acc.push([]);
//       acc[acc.length - 1].push(chat);

//       if (index < chats.length - 1) {
//         acc.push([]);
//       }
//     } else {
//       if (acc.length === 0) acc.push([]);
//       acc[acc.length - 1].push(chat);
//     }

//     return acc;
//   }, []);
// };
