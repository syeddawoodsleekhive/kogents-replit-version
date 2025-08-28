import { useEffect, useState } from "react";

const useNetworkCheck = () => {
  const [isOffline, setIsOffline] = useState(false);
  useEffect(() => {
    let onlineCheckTimeout: NodeJS.Timeout | null = null;

    async function isNetworkReallyOnline() {
      if (!navigator.onLine) return false;
      try {
        await fetch("https://www.google.com/generate_204", {
          method: "GET",
          cache: "no-store",
          mode: "no-cors",
        });
        return true;
      } catch {
        return false;
      }
    }

    const handleOnline = async () => {
      const isOnline = await isNetworkReallyOnline();
      if (isOffline) {
        if (isOnline) {
          setIsOffline(false);
        } else {
          onlineCheckTimeout = setTimeout(handleOnline, 1000);
        }
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      if (onlineCheckTimeout) {
        clearTimeout(onlineCheckTimeout);
        onlineCheckTimeout = null;
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (onlineCheckTimeout) {
        clearTimeout(onlineCheckTimeout);
      }
    };
  }, [isOffline]);

  return { isOffline };
};

export default useNetworkCheck;
