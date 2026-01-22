"use client";
import { createContext, type ReactNode, useContext, useState } from "react";

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

	return (
		<GlobalSearchContext.Provider
			value={{ onOpenChange, basePath, preview, setPreview }}
		>
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
