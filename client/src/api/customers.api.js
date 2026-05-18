import { apiClient, apiData } from "./apiClient";

export const customersApi = {
  list: (search = "") => apiData(apiClient.get("/customers", { params: { search } })),
  create: (payload) => apiData(apiClient.post("/customers", payload)),
  update: (id, payload) => apiData(apiClient.put(`/customers/${id}`, payload)),
  remove: (id) => apiData(apiClient.delete(`/customers/${id}`)),
  invoices: (id) => apiData(apiClient.get(`/customers/${id}/invoices`)),
  outstanding: (id) => apiData(apiClient.get(`/customers/${id}/outstanding`)),
};
