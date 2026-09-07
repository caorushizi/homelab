export interface WorkspaceState {
	version: 1;
	routerID?: string;
	machineID?: string;
	noteOpen: boolean;
	noteEditing: boolean;
	sidebarCollapsed: boolean;
	detailCollapsed: boolean;
}
export const emptyWorkspace = (): WorkspaceState => ({
	version: 1,
	noteOpen: false,
	noteEditing: false,
	sidebarCollapsed: false,
	detailCollapsed: false,
});
export const workspaceKey = (server: string) => `homelab:workspace:v1:${server}`;
export function parseWorkspace(raw: string | null): WorkspaceState {
	const fallback = emptyWorkspace();
	if (!raw) return fallback;
	try {
		const value = JSON.parse(raw);
		if (value?.version !== 1) return fallback;
		return {
			version: 1,
			routerID: typeof value.routerID === "string" ? value.routerID : undefined,
			machineID: typeof value.machineID === "string" ? value.machineID : undefined,
			noteOpen: value.noteOpen === true,
			noteEditing: value.noteEditing === true,
			sidebarCollapsed: value.sidebarCollapsed === true,
			detailCollapsed: value.detailCollapsed === true,
		};
	} catch {
		return fallback;
	}
}
export function readWorkspace(server: string): WorkspaceState {
	try {
		return parseWorkspace(localStorage.getItem(workspaceKey(server)));
	} catch {
		return emptyWorkspace();
	}
}
export function writeWorkspace(server: string, value: WorkspaceState): boolean {
	try {
		localStorage.setItem(workspaceKey(server), JSON.stringify(value));
		return true;
	} catch {
		return false;
	}
}
// Resolve deleted devices only against a successfully loaded inventory.
export function reconcileWorkspace(
	value: WorkspaceState,
	routers: { id: string; machines: { id: string }[] }[],
): WorkspaceState {
	if (!value.routerID) return { ...value, machineID: undefined, noteOpen: false };
	const router = routers.find((item) => item.id === value.routerID);
	if (!router) return { ...value, routerID: undefined, machineID: undefined, noteOpen: false };
	if (value.machineID && !router.machines.some((item) => item.id === value.machineID))
		return { ...value, machineID: undefined, noteOpen: false };
	return value;
}
