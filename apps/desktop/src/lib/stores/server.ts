import { createStore } from "@/lib/utils";

const SERVER_URL_KEY = "homelab_server_url";

export function normalizeServerURL(rawValue: string) {
	const trimmed = rawValue.trim();
	if (!trimmed) throw new Error("请输入服务器地址");

	const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
	const parsed = new URL(withProtocol);
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error("服务器地址只支持 HTTP 或 HTTPS");
	}

	parsed.search = "";
	parsed.hash = "";
	parsed.pathname = parsed.pathname.replace(/\/(api\/v1)?\/?$/, "").replace(/\/$/, "");
	return parsed.toString().replace(/\/$/, "");
}

export function getStoredServerURL() {
	return localStorage.getItem(SERVER_URL_KEY) || "";
}

interface ServerState {
	serverURL: string;
	connect: (serverURL: string) => void;
	disconnect: () => void;
}

export const useServerStore = createStore<ServerState>(
	(set) => ({
		serverURL: getStoredServerURL(),
		connect: (serverURL) => {
			const normalized = normalizeServerURL(serverURL);
			localStorage.setItem(SERVER_URL_KEY, normalized);
			set({ serverURL: normalized });
		},
		disconnect: () => {
			localStorage.removeItem(SERVER_URL_KEY);
			set({ serverURL: "" });
		},
	}),
	"serverStore",
);
