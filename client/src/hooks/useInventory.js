import { inventoryApi } from "../api/inventory.api";
import { useAsync } from "./useAsync";

export const useInventory = (search = "") => useAsync(() => inventoryApi.list(search), [search]);
