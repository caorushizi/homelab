import http from "@/lib/http";

export interface MachineNote {
	machine_id: string;
	content: string;
	revision: number;
	updated_at: string;
}
// Absolute URLs pin in-flight requests to the server that owns the draft.
const path = (server: string, id: string) =>
	`${server}/api/v1/machines/${encodeURIComponent(id)}/note`;
export async function getNote(server: string, id: string) {
	return (await http.get<MachineNote>(path(server, id))).data;
}
export async function saveNote(server: string, id: string, content: string, revision: number) {
	return (await http.put<MachineNote>(path(server, id), { content, revision })).data;
}
