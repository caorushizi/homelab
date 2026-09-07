import { getCurrentWindow } from "@tauri-apps/api/window";
import type { MouseEvent } from "react";
import { toast } from "@/lib/toast";

export const isDesktopWindow = () => "__TAURI_INTERNALS__" in window;
export const isMacDesktopWindow = () => isDesktopWindow() && /Mac/i.test(navigator.platform);

async function windowAction(action: "toggleMaximize" | "startDragging") {
	if (!isDesktopWindow()) return;
	try {
		await getCurrentWindow()[action]();
	} catch {
		toast.error("窗口操作失败，请重试");
	}
}

// Only the toolbar's empty space moves the window; interactive controls keep their clicks.
export function dragWindow(event: MouseEvent<HTMLElement>) {
	if (event.button !== 0 || event.target !== event.currentTarget || !isDesktopWindow()) return;
	event.preventDefault();
	void windowAction(event.detail === 2 ? "toggleMaximize" : "startDragging");
}
