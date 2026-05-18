import { apiClient, apiData } from "./apiClient";

export const settingsApi = {
  bootstrap: () => apiData(apiClient.get("/settings/bootstrap")),
  onboard: (payload) => apiData(apiClient.post("/settings/onboarding", payload)),
  get: () => apiData(apiClient.get("/settings")),
  update: (payload) => apiData(apiClient.put("/settings", payload)),
};
