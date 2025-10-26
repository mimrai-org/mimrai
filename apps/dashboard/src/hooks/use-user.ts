import type { Scope } from "@mimir/api/scopes";
import { useOpenPanel } from "@mimir/events/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { trpc } from "@/utils/trpc";

export const useUser = () => {
  const { data } = useQuery(trpc.users.getCurrent.queryOptions());

  return data;
};

export const useScopes = (scopes: Scope[]) => {
  const user = useUser();
  const { identify } = useOpenPanel();
  useEffect(() => {
    if (!user) return;
    identify({
      profileId: user.id!,
      firstName: user.name?.split(" ")[0] || "",
      lastName: user.name?.split(" ")[1] || "",
      email: user.email || "",
    });
  }, [user]);

  if (!user) return false;

  if (scopes.length === 0) return true;

  if (!user.team) return false;
  if (!user.team.scopes) return false;

  if (user.team.scopes.length === 0) return false;

  // Check if user has all required scopes
  return user.team.scopes.every((scope) => scopes.includes(scope));
};
