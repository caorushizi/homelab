import { openUrl } from "@tauri-apps/plugin-opener";

export async function openExternal(url: string): Promise<void> {
	const target = new URL(url);
	if (target.protocol !== "http:" && target.protocol !== "https:") {
		throw new Error("仅支持 HTTP 或 HTTPS 地址");
	}

	if ("__TAURI_INTERNALS__" in window) {
		await openUrl(target.toString());
		return;
	}

	window.open(target.toString(), "_blank", "noopener,noreferrer");
}
