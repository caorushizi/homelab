import httpClient from "@/lib/http";
import type {
	Machine,
	MachineInput,
	RouterDevice,
	RouterInput,
	ServiceEndpoint,
	ServiceInput,
} from "@/types/inventory";

const topologyPath = "/topology";

export const topologyKey = (serverURL: string) => `topology:${serverURL}`;

export async function getTopology(): Promise<RouterDevice[]> {
	const response = await httpClient.get<RouterDevice[]>(topologyPath);
	return response.data;
}

export async function createRouter(input: RouterInput): Promise<RouterDevice> {
	const response = await httpClient.post<RouterDevice>("/routers", input);
	return response.data;
}

export async function createMachine(routerID: string, input: MachineInput): Promise<Machine> {
	const response = await httpClient.post<Machine>(`/routers/${routerID}/machines`, input);
	return response.data;
}

export async function createService(
	machineID: string,
	input: ServiceInput,
): Promise<ServiceEndpoint> {
	const response = await httpClient.post<ServiceEndpoint>(`/machines/${machineID}/services`, input);
	return response.data;
}

export async function updateRouter(id: string, input: RouterInput): Promise<RouterDevice> {
	return (await httpClient.patch<RouterDevice>(`/routers/${encodeURIComponent(id)}`, input)).data;
}
export async function updateMachine(id: string, input: MachineInput): Promise<Machine> {
	return (await httpClient.patch<Machine>(`/machines/${encodeURIComponent(id)}`, input)).data;
}
export async function updateService(id: string, input: ServiceInput): Promise<ServiceEndpoint> {
	return (await httpClient.patch<ServiceEndpoint>(`/services/${encodeURIComponent(id)}`, input))
		.data;
}
export async function deleteInventory(
	kind: "router" | "machine" | "service",
	id: string,
): Promise<void> {
	const paths = { router: "routers", machine: "machines", service: "services" };
	await httpClient.delete(`/${paths[kind]}/${encodeURIComponent(id)}`);
}
