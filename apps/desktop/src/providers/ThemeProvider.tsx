import type React from "react";
import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Toaster } from "@/components/ui/sonner";
import { useThemeStore } from "@/lib/stores/theme";

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
	const { mode } = useThemeStore();

	// 同步主题到 DOM
	useEffect(() => {
		const root = document.documentElement;
		root.setAttribute("data-theme", mode);
		root.classList.toggle("dark", mode === "dark");
		root.classList.toggle("light", mode === "light");
		root.style.colorScheme = mode;

		if ("__TAURI_INTERNALS__" in window) {
			void getCurrentWindow().setTheme(mode);
		}
	}, [mode]);

	return (
		<>
			{children}
			<Toaster />
		</>
	);
};
