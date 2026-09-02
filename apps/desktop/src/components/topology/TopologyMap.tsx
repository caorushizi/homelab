import {
	BaseEdge,
	Controls,
	getBezierPath,
	Handle,
	Position,
	ReactFlow,
	type Edge,
	type EdgeProps,
	type Node,
	type NodeProps,
} from "@xyflow/react";
import { ExternalLink, Server } from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import { SiHomeassistant } from "react-icons/si";
import { Button } from "@/components/ui/button";
import type { Machine, RouterDevice } from "@/types/inventory";
import "@xyflow/react/dist/style.css";

interface TopologyMapProps {
	router: RouterDevice;
	selectedMachineID?: string;
	onSelectMachine: (machineID: string) => void;
	onOpenRouter: () => void;
}

interface RouterNodeData extends Record<string, unknown> {
	router: RouterDevice;
	onManage: () => void;
}

interface MachineNodeData extends Record<string, unknown> {
	machine: Machine;
	selected: boolean;
	compact: boolean;
	targetPosition: Position;
	onSelect: () => void;
}

type RouterFlowNode = Node<RouterNodeData, "router">;
type MachineFlowNode = Node<MachineNodeData, "machine">;

interface MachineLayoutSlot {
	x: number;
	y: number;
	target: Position;
	source: Position;
}

const machineNodeWidth = 176;
const machineNodeHeight = 160;
const routerNodeWidth = 224;
const routerNodeHeight = 270;
const maxMachinesPerRing = 12;

function connectionPositions(deltaX: number, deltaY: number) {
	if (Math.abs(deltaX) > Math.abs(deltaY)) {
		return deltaX > 0
			? { source: Position.Right, target: Position.Left }
			: { source: Position.Left, target: Position.Right };
	}
	return deltaY > 0
		? { source: Position.Bottom, target: Position.Top }
		: { source: Position.Top, target: Position.Bottom };
}

function buildMachineLayout(count: number) {
	if (count === 0) {
		return {
			center: { x: 410, y: 260 },
			slots: [] as MachineLayoutSlot[],
		};
	}

	const ringCount = Math.ceil(count / maxMachinesPerRing);
	const baseCount = Math.floor(count / ringCount);
	const remainder = count % ringCount;
	const ringCounts = Array.from(
		{ length: ringCount },
		(_, ringIndex) => baseCount + (ringIndex < remainder ? 1 : 0),
	);
	const outerRingIndex = ringCount - 1;
	const outerRadiusX = 410 + outerRingIndex * 240;
	const outerRadiusY = 230 + outerRingIndex * 150;
	const center = { x: outerRadiusX + 200, y: outerRadiusY + 180 };
	const slots: MachineLayoutSlot[] = [];

	ringCounts.forEach((itemsInRing, ringIndex) => {
		const radiusX = 410 + ringIndex * 240;
		const radiusY = 230 + ringIndex * 150;
		const angleOffset = -Math.PI / 2 + ringIndex * (Math.PI / Math.max(itemsInRing, 1));

		for (let itemIndex = 0; itemIndex < itemsInRing; itemIndex += 1) {
			const angle = angleOffset + (itemIndex / itemsInRing) * Math.PI * 2;
			const deltaX = Math.cos(angle) * radiusX;
			const deltaY = Math.sin(angle) * radiusY;
			const handles = connectionPositions(deltaX, deltaY);
			slots.push({
				x: center.x + deltaX - machineNodeWidth / 2,
				y: center.y + deltaY - machineNodeHeight / 2,
				target: handles.target,
				source: handles.source,
			});
		}
	});

	return { center, slots };
}

const deviceAsset: Record<string, string> = {
	nas: "/devices/nas-black.png",
	server: "/devices/server-black.png",
	laptop: "/devices/laptop.png",
	board: "/devices/single-board-computer.png",
};

function RouterNode({ data }: NodeProps<RouterFlowNode>) {
	const image =
		data.router.image === "router-black"
			? "/devices/router-black.png"
			: "/devices/router-white.png";
	return (
		<div className="relative flex w-56 flex-col items-center text-center">
			{([Position.Top, Position.Right, Position.Bottom, Position.Left] as const).map((position) => (
				<Handle
					key={position}
					id={position}
					type="source"
					position={position}
					className="opacity-0"
				/>
			))}
			<div className="topology-router-orbit">
				<img src={image} alt="" className="h-28 w-36 object-contain drop-shadow-2xl" />
			</div>
			<strong className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
				{data.router.name}
			</strong>
			<span className="mt-1 font-mono text-sm text-primary">
				{data.router.machines.length} 台机器
			</span>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="mt-3 border-primary/30 bg-primary/6 text-primary hover:bg-primary/12"
				onClick={data.onManage}
			>
				<ExternalLink />
				打开管理页
			</Button>
		</div>
	);
}

function MachineVisual({ machine, compact }: { machine: Machine; compact: boolean }) {
	if (machine.image === "home-assistant") {
		return (
			<SiHomeassistant
				className={`${compact ? "size-12" : "size-16"} text-info-foreground drop-shadow-lg`}
				aria-hidden="true"
			/>
		);
	}
	const asset = deviceAsset[machine.image];
	if (asset)
		return (
			<img
				src={asset}
				alt=""
				className={`${compact ? "h-20 w-24" : "h-24 w-28"} object-contain drop-shadow-2xl`}
			/>
		);
	return (
		<Server
			className={compact ? "size-11 text-muted-foreground" : "size-14 text-muted-foreground"}
			aria-hidden="true"
		/>
	);
}

function MachineNode({ data }: NodeProps<MachineFlowNode>) {
	return (
		<>
			<Handle type="target" position={data.targetPosition} className="opacity-0" />
			<button
				type="button"
				className={`group flex flex-col items-center text-center focus-visible:outline-none ${data.compact ? "w-36" : "w-44"}`}
				onClick={data.onSelect}
				aria-pressed={data.selected}
				title={`${data.machine.name} · ${data.machine.address}`}
			>
				<span
					className={`topology-machine-orbit ${data.compact ? "is-compact" : ""} ${data.selected ? "is-selected" : ""}`}
				>
					<MachineVisual machine={data.machine} compact={data.compact} />
				</span>
				<strong
					className={`mt-2 block truncate font-semibold text-foreground transition group-hover:text-primary ${data.compact ? "max-w-36 text-sm" : "max-w-44 text-base"}`}
				>
					{data.machine.name}
				</strong>
				<span
					className={`mt-1 block truncate font-mono text-xs text-muted-foreground ${data.compact ? "max-w-36" : "max-w-44"}`}
				>
					{data.machine.address}
				</span>
			</button>
		</>
	);
}

function GlowEdge(props: EdgeProps) {
	const [path] = getBezierPath(props);
	return <BaseEdge path={path} {...props} className="topology-edge" />;
}

const nodeTypes = { router: RouterNode, machine: MachineNode };
const edgeTypes = { glow: GlowEdge };

export const TopologyMap: React.FC<TopologyMapProps> = ({
	router,
	selectedMachineID,
	onSelectMachine,
	onOpenRouter,
}) => {
	const { nodes, edges } = useMemo(() => {
		const layout = buildMachineLayout(router.machines.length);
		const compact = router.machines.length > 8;
		const routerNode: RouterFlowNode = {
			id: router.id,
			type: "router",
			position: {
				x: layout.center.x - routerNodeWidth / 2,
				y: layout.center.y - routerNodeHeight / 2,
			},
			data: { router, onManage: onOpenRouter },
			draggable: false,
		};

		const machineNodes: MachineFlowNode[] = router.machines.map((machine, index) => {
			const slot = layout.slots[index];
			return {
				id: machine.id,
				type: "machine",
				position: { x: slot.x, y: slot.y },
				data: {
					machine,
					selected: machine.id === selectedMachineID,
					compact,
					targetPosition: slot.target,
					onSelect: () => onSelectMachine(machine.id),
				},
				draggable: false,
			};
		});

		const machineEdges: Edge[] = router.machines.map((machine, index) => ({
			id: `${router.id}-${machine.id}`,
			source: router.id,
			target: machine.id,
			sourceHandle: layout.slots[index].source,
			type: "glow",
			animated: true,
		}));

		return { nodes: [routerNode, ...machineNodes], edges: machineEdges };
	}, [onOpenRouter, onSelectMachine, router, selectedMachineID]);

	return (
		<div className="h-full w-full" aria-label={`${router.name} 网络拓扑`}>
			<ReactFlow
				key={`${router.id}-${router.machines.length}`}
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				fitView
				fitViewOptions={{
					padding: 0.12,
					minZoom: 0.35,
					maxZoom: router.machines.length > 8 ? 0.72 : 0.9,
				}}
				minZoom={0.28}
				maxZoom={1.25}
				nodesDraggable={false}
				panOnDrag
				zoomOnScroll
				zoomOnPinch
				zoomOnDoubleClick
				preventScrolling
				proOptions={{ hideAttribution: true }}
			>
				<Controls position="top-right" showInteractive={false} />
			</ReactFlow>
		</div>
	);
};
