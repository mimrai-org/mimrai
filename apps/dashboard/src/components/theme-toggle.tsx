"use client";

import { Switch } from "@mimir/ui/switch";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
	const { setTheme, theme } = useTheme();

	const handleThemeChange = (checked: boolean) => {
		setTheme(checked ? "dark" : "light");
	};

	return (
		<div className="flex items-center gap-2">
			<SunIcon
				className="size-4 cursor-pointer text-muted-foreground"
				onClick={() => setTheme("light")}
			/>
			<Switch checked={theme === "dark"} onCheckedChange={handleThemeChange} />
			<MoonIcon
				className="size-4 cursor-pointer text-muted-foreground"
				onClick={() => setTheme("dark")}
			/>
		</div>
	);
}
