import { apiClient, apiData } from "./apiClient";

export const invoicesApi = {
  list: (filter = "all") => apiData(apiClient.get("/invoices", { params: { filter } })),
  get: (id) => apiData(apiClient.get(`/invoices/${id}`)),
  create: (payload) => apiData(apiClient.post("/invoices", payload)),
  update: (id, payload) => apiData(apiClient.put(`/invoices/${id}`, payload)),
  remove: (id) => apiData(apiClient.delete(`/invoices/${id}`)),
  sendEmail: (id, payload) => apiData(apiClient.post(`/invoices/${id}/send-email`, payload)),
  downloadPdf: (id) => apiData(apiClient.get(`/invoices/${id}/download-pdf`)),
  logPayment: (id, payload) => apiData(apiClient.post(`/invoices/${id}/payment`, payload)),
  paymentHistory: (id) => apiData(apiClient.get(`/invoices/${id}/payment-history`)),
};
