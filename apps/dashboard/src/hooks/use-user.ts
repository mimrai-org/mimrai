import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export const useUser = () => {
	const { data } = useQuery(trpc.users.getCurrent.queryOptions());

	return data;
};
