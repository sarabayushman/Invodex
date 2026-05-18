import { apiClient, apiData } from "./apiClient";

export const inventoryApi = {
  list: (search = "") => apiData(apiClient.get("/products", { params: { search } })),
  create: (payload) => apiData(apiClient.post("/products", payload)),
  update: (id, payload) => apiData(apiClient.put(`/products/${id}`, payload)),
  remove: (id) => apiData(apiClient.delete(`/products/${id}`)),
  hsnLookup: (code) => apiData(apiClient.get("/hsn-lookup", { params: { code } })),
};
