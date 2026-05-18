import { settingsApi } from "../api/settings.api";
import { useAsync } from "./useAsync";

export const useSettings = () => useAsync(() => settingsApi.get(), []);
