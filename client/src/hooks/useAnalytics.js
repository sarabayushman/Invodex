import { analyticsApi } from "../api/analytics.api";
import { useAsync } from "./useAsync";

export const useAnalytics = () => useAsync(async () => ({ summary: await analyticsApi.summary(), charts: await analyticsApi.charts() }), []);
