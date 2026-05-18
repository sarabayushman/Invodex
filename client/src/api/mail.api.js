import { apiClient, apiData } from "./apiClient";

export const mailApi = {
  logs: (type = "") => apiData(apiClient.get("/mail-logs", { params: { type } })),
  sendReminder: (invoiceId, payload = {}) => apiData(apiClient.post(`/mail/send-reminder/${invoiceId}`, payload)),
};
