import { useEffect, useState } from "react";
import { Navigate, useLocation, useRoutes } from "react-router-dom";
import { SettingsPage } from "@/pages/Settings";
import { Home } from "@/pages/Home";
import { useServerStore } from "@/lib/stores/server";
import { readWorkspace } from "@/lib/workspace-state";

export function AppRoutes() {
	const serverURL = useServerStore((state) => state.serverURL);
	return <ServerRoutes key={serverURL} serverURL={serverURL} />;
}
function ServerRoutes({ serverURL }: { serverURL: string }) {
	const location = useLocation();
	const [startupPath, setStartupPath] = useState(() => {
		const saved = readWorkspace(serverURL);
		return location.pathname === "/" && saved.routerID
			? `/routers/${encodeURIComponent(saved.routerID)}`
			: null;
	});
	useEffect(() => {
		if (startupPath === location.pathname) setStartupPath(null);
	}, [location.pathname, startupPath]);
	const routes = useRoutes([
		{ path: "/", element: <Home /> },
		{ path: "/settings", element: <SettingsPage /> },
		{ path: "/routers/:routerID", element: <Home /> },
		{ path: "*", element: <Navigate to="/" replace /> },
	]);
	// Do not mount overview until startup navigation resolves: its effects would
	// otherwise overwrite the saved machine and note state before restoration.
	if (startupPath && location.pathname !== startupPath)
		return <Navigate to={startupPath} replace />;
	return routes;
}
