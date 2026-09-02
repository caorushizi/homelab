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
