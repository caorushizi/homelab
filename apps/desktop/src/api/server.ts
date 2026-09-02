import axios from "axios";
import { normalizeServerURL } from "@/lib/stores/server";
import type { ApiResponse } from "@/types/api";

export interface ServerHealth {
	driver: string;
	status: string;
}

export async function checkServerConnection(rawServerURL: string) {
	const serverURL = normalizeServerURL(rawServerURL);
	const response = await axios.get<ApiResponse<ServerHealth>>(`${serverURL}/health`, {
		timeout: 8000,
	});

	if (!response.data.success || response.data.data?.status !== "ok") {
		throw new Error("服务器健康检查未通过");
	}

	return { serverURL, health: response.data.data };
}
