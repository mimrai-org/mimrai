"use client";
import type { RouterOutputs } from "@mimir/trpc";
import { createContext, useContext, useMemo } from "react";

type User = RouterOutputs["users"]["getCurrent"];
type ExtendedUser = User & {
	basePath: string;
};

export const UserContext = createContext<ExtendedUser | null>(null);

export const UserProvider = ({
	children,
	user,
}: {
	children: React.ReactNode;
	user: User | null;
}) => {
	const basePath = user?.team ? `/team/${user.team.slug}` : "/team";
	const extendedUser = useMemo(() => {
		if (!user) return null;
		return {
			...user,
			basePath,
		};
	}, [user, basePath]);

	return (
		<UserContext.Provider value={extendedUser}>{children}</UserContext.Provider>
	);
};

export const useUser = () => {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error("useUser must be used within a UserProvider");
	}
	return context;
};
