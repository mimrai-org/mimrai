"use client";
import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useState,
} from "react";

type GlobalSearchContextValue = {
	onOpenChange: (open: boolean) => void;
	basePath: string;
	preview: ReactNode | null;
	setPreview: (preview: ReactNode | null) => void;
};

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(
	null,
);

export const GlobalSearchProvider = ({
	children,
	onOpenChange,
	basePath,
}: {
	children: React.ReactNode;
	onOpenChange: (open: boolean) => void;
	basePath: string;
}) => {
	const [preview, setPreview] = useState<ReactNode | null>(null);

	const contextValue = useMemo<GlobalSearchContextValue>(
		() => ({
			onOpenChange,
			basePath,
			preview,
			setPreview,
		}),
		[onOpenChange, basePath, preview],
	);

	return (
		<GlobalSearchContext.Provider value={contextValue}>
			{children}
		</GlobalSearchContext.Provider>
	);
};

export const useGlobalSearch = () => {
	const context = useContext(GlobalSearchContext);
	if (!context) {
		throw new Error("useGlobalSearch must be used within GlobalSearchProvider");
	}
	return context;
};
