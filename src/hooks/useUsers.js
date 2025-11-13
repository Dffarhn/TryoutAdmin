import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchUsers(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) {
    searchParams.append("search", params.search);
  }

  const url = `/api/users${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch users");
  }
  const data = await res.json();
  return data.data || [];
}

export function useUsers(params = {}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => fetchUsers(params),
  });
}

