export type InventoryStatus = "online" | "offline" | "unknown";

export interface ServiceEndpoint {
	id: string;
	machine_id: string;
	name: string;
	url: string;
	icon: string;
	status: InventoryStatus;
	sort_order: number;
}

export interface Machine {
	id: string;
	router_id: string;
	name: string;
	address: string;
	management_url: string;
	image: string;
	status: InventoryStatus;
	sort_order: number;
	services: ServiceEndpoint[];
}

export interface RouterDevice {
	id: string;
	name: string;
	address: string;
	management_url: string;
	image: string;
	status: InventoryStatus;
	sort_order: number;
	machines: Machine[];
}

export interface RouterInput {
	name: string;
	address: string;
	management_url: string;
	image: string;
	status: InventoryStatus;
	sort_order: number;
}

export interface MachineInput extends RouterInput {}

export interface ServiceInput {
	name: string;
	url: string;
	icon: string;
	status: InventoryStatus;
	sort_order: number;
}
