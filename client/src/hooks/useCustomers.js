import { customersApi } from "../api/customers.api";
import { useAsync } from "./useAsync";

export const useCustomers = (search = "") => useAsync(() => customersApi.list(search), [search]);
