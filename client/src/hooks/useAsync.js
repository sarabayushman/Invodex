import { useCallback, useEffect, useState } from "react";

export function useAsync(loader, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await loader());
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload, setData };
}
