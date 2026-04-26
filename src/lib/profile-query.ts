import { queryOptions } from "@tanstack/react-query";

import { fetchUserProfile } from "@/lib/profile";

export const PROFILE_STALE_TIME = 5 * 60 * 1000;

export const profileQueryKey = (userId?: string) => ["user-profile", userId] as const;

export const profileQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: profileQueryKey(userId),
    queryFn: () => fetchUserProfile(userId),
    staleTime: PROFILE_STALE_TIME,
  });
