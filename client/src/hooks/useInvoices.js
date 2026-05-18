import { invoicesApi } from "../api/invoices.api";
import { useAsync } from "./useAsync";

export const useInvoices = (filter = "all") => useAsync(() => invoicesApi.list(filter), [filter]);
