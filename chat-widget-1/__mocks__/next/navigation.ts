export const useSearchParams = () => ({
  get: (key: string) => {
    if (key === "apiToken") return "mock-token";
    return null;
  },
});
