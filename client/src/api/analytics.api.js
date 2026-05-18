import { apiClient, apiData } from "./apiClient";

export const analyticsApi = {
  summary: () => apiData(apiClient.get("/analytics/summary")),
  charts: () => apiData(apiClient.get("/analytics/charts")),
  chat: (message) => apiData(apiClient.post("/analytics/chat", { message })),
};
