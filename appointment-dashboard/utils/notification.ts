let notifiedIds: Set<string> = new Set();
let channel: BroadcastChannel | null = null;
let listenersInitialized = false;

export function isTabHidden(): boolean {
  return typeof document !== "undefined" && document.hidden;
}

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.log("This browser does not support notifications.");
    return;
  }
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

export function initNotificationListeners() {
  if (listenersInitialized || typeof window === "undefined") return;
  listenersInitialized = true;

  if ("BroadcastChannel" in window) {
    if (!channel) {
      channel = new BroadcastChannel("chat-notifications");
    }
    channel.onmessage = (event) => {
      if (event.data?.type === "notified" && event.data?.id) {
        notifiedIds.add(event.data.id);
      }
    };
  } else if (typeof window !== "undefined") {
    (window as Window).addEventListener("storage", (event) => {
      if (event.key?.startsWith("notified:")) {
        const id = event.key.split(":")[1];
        notifiedIds.add(id);
      }
    });
  }
}

export function showNotificationOnce(
  id: string,
  title: string,
  options?: NotificationOptions,
  onClick?: () => void
) {
  if (typeof window === "undefined") return;
  if (notifiedIds.has(id)) return;
  notifiedIds.add(id);

  // Notify other tabs
  if ("BroadcastChannel" in window) {
    if (!channel) {
      channel = new BroadcastChannel("chat-notifications");
    }
    channel.postMessage({ type: "notified", id });
  } else {
    localStorage.setItem(`notified:${id}`, "1");
  }

  if (Notification.permission === "granted" && document.hidden) {
    const notification = new Notification(title, {
      ...options,
      icon: options?.icon || "/favicon.png",
      badge: options?.badge || "/badge-72x72.png",
      silent: options?.silent || false,
      requireInteraction: options?.requireInteraction || false,
    });
    if (onClick) {
      notification.onclick = onClick;
    } else {
      notification.onclick = function (event) {
        event.preventDefault();
        window.focus();
        if (options?.data && (options.data as any).url) {
          window.location.href = (options.data as any).url;
        }
      };
    }
  }
}

export function clearNotifiedIds() {
  notifiedIds.clear();
}
