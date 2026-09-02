import type React from "react";
import { ServerSetup } from "@/pages/ServerSetup";
import { useServerStore } from "@/lib/stores/server";
import { AppRoutes } from "@/router/routes";

export const App: React.FC = () => {
	const serverURL = useServerStore((state) => state.serverURL);

	if (!serverURL) return <ServerSetup />;

	return (
		<div className="min-h-screen bg-background text-foreground">
			<AppRoutes />
		</div>
	);
};
