import { useEffect, useRef } from "react";
import { ArrowRight, Copy, ExternalLink, FolderOpen, Globe2 } from "lucide-react";
import { SiDocker, SiImmich, SiJellyfin, SiPlex, SiSyncthing } from "react-icons/si";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { DeviceVisual } from "./DeviceVisual";
import { useToast } from "@/hooks/useToast";
import { stageSelectionSpring } from "@/lib/stage-motion";
import type { Machine, ServiceEndpoint } from "@/types/inventory";

function StageVisual({ machine, className }: { machine: Machine; className: string }) {
	return machine.image === "nas" || machine.image === "server" ? (
		<img
			src="/devices/stage-nas.png"
			className={`${className} stage-nas-image`}
			alt=""
			draggable={false}
		/>
	) : (
		<DeviceVisual image={machine.image} className={className} />
	);
}
function ServiceIcon({ service }: { service: ServiceEndpoint }) {
	const icons = {
		plex: SiPlex,
		immich: SiImmich,
		jellyfin: SiJellyfin,
		syncthing: SiSyncthing,
		docker: SiDocker,
		files: FolderOpen,
	};
	const Icon = icons[service.icon as keyof typeof icons] || Globe2;
	return <Icon aria-hidden="true" />;
}
function DevicePresentation({
	machine,
	onOpen,
	onNotes,
}: {
	machine: Machine;
	onOpen: (url: string, name: string) => Promise<void>;
	onNotes: () => void;
}) {
	const reduce = useReducedMotion();
	const toast = useToast();
	const tiltX = useMotionValue(0),
		tiltY = useMotionValue(0);
	const rotateX = useSpring(tiltX, { stiffness: 110, damping: 22 });
	const rotateY = useSpring(tiltY, { stiffness: 110, damping: 22 });
	async function copyAddress() {
		try {
			await navigator.clipboard.writeText(machine.address);
			toast.success("地址已复制");
		} catch {
			toast.error("无法复制地址");
		}
	}
	return (
		<motion.div
			className="stage-presentation"
			initial={{ opacity: 0, y: reduce ? 0 : 12 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: reduce ? 0 : -8 }}
			transition={{ duration: reduce ? 0 : 0.2 }}
		>
			<div
				className="stage-art"
				aria-hidden="true"
				onPointerMove={(event) => {
					if (reduce || event.pointerType !== "mouse") return;
					const rect = event.currentTarget.getBoundingClientRect();
					tiltY.set(((event.clientX - rect.left) / rect.width - 0.5) * 9);
					tiltX.set(-((event.clientY - rect.top) / rect.height - 0.5) * 7);
				}}
				onPointerLeave={() => {
					tiltX.set(0);
					tiltY.set(0);
				}}
			>
				<motion.div className="stage-art-tilt" style={reduce ? undefined : { rotateX, rotateY }}>
					<div className="stage-art-float">
						<StageVisual machine={machine} className="stage-hero-image" />
					</div>
				</motion.div>
			</div>
			<section className="stage-device-details" aria-label={`${machine.name} 详情`}>
				<h1 title={machine.name}>{machine.name}</h1>
				<button
					className="stage-copy-address"
					onClick={() => void copyAddress()}
					title="复制设备地址"
					aria-label={`复制设备地址 ${machine.address}`}
				>
					<span>{machine.address}</span>
					<Copy size={15} />
				</button>
				<div className="stage-services" aria-label="设备服务">
					{machine.services.map((service) => (
						<button
							className="stage-service"
							key={service.id}
							title={`打开 ${service.name} · ${service.url}`}
							onClick={() => void onOpen(service.url, service.name)}
						>
							<span className="stage-service-icon">
								<ServiceIcon service={service} />
							</span>
							<span>{service.name}</span>
							<ArrowRight size={20} />
						</button>
					))}
					{!machine.services.length && <p className="stage-no-services">暂未添加服务</p>}
				</div>
				<div className="stage-device-actions">
					<button
						className="stage-primary-button"
						disabled={!machine.management_url}
						title={machine.management_url || "尚未配置管理地址"}
						onClick={() => void onOpen(machine.management_url, machine.name)}
					>
						打开管理页 <ExternalLink size={17} />
					</button>
					<button className="stage-notes-button" onClick={onNotes}>
						设备备注
					</button>
				</div>
			</section>
		</motion.div>
	);
}
export function DeviceStage({
	machines,
	machine,
	onSelect,
	onOpen,
	onNotes,
}: {
	machines: Machine[];
	machine: Machine;
	onSelect: (id: string) => void;
	onOpen: (url: string, name: string) => Promise<void>;
	onNotes: () => void;
}) {
	const reduce = useReducedMotion();
	const buttons = useRef(new Map<string, HTMLButtonElement>());
	const dock = useRef<HTMLElement>(null);
	useEffect(() => {
		const reveal = (behavior: ScrollBehavior) => {
			const container = dock.current;
			const button = buttons.current.get(machine.id);
			if (!container || !button) return;
			const containerRect = container.getBoundingClientRect();
			const buttonRect = button.getBoundingClientRect();
			container.scrollTo({
				left:
					container.scrollLeft +
					buttonRect.left -
					containerRect.left -
					container.clientLeft -
					(container.clientWidth - buttonRect.width) / 2,
				behavior,
			});
		};
		reveal(reduce ? "auto" : "smooth");
		const observer = new ResizeObserver(() => reveal("auto"));
		if (dock.current) observer.observe(dock.current);
		return () => observer.disconnect();
	}, [machine.id, reduce]);
	return (
		<div className="stage-device-workbench">
			<div className="stage-presentation-area">
				<AnimatePresence mode="wait" initial={false}>
					<DevicePresentation
						key={machine.id}
						machine={machine}
						onOpen={onOpen}
						onNotes={onNotes}
					/>
				</AnimatePresence>
			</div>
			<motion.nav ref={dock} layoutScroll className="stage-device-dock" aria-label="设备切换">
				<div
					className="stage-dock-items"
					role="toolbar"
					aria-label="选择设备"
					onKeyDown={(event) => {
						const index = machines.findIndex((item) => item.id === machine.id);
						let next = index;
						if (event.key === "ArrowRight") next = (index + 1) % machines.length;
						else if (event.key === "ArrowLeft")
							next = (index - 1 + machines.length) % machines.length;
						else if (event.key === "Home") next = 0;
						else if (event.key === "End") next = machines.length - 1;
						else return;
						event.preventDefault();
						onSelect(machines[next].id);
						buttons.current.get(machines[next].id)?.focus({ preventScroll: true });
					}}
				>
					{machines.map((item) => (
						<button
							ref={(node) => {
								if (node) buttons.current.set(item.id, node);
								else buttons.current.delete(item.id);
							}}
							className="stage-dock-device"
							key={item.id}
							aria-label={`查看 ${item.name}`}
							aria-pressed={machine.id === item.id}
							tabIndex={machine.id === item.id ? 0 : -1}
							title={item.name}
							onClick={() => onSelect(item.id)}
						>
							{machine.id === item.id && (
								<motion.span
									className="stage-dock-selection"
									layoutId="stage-dock-selection"
									transition={reduce ? { duration: 0 } : stageSelectionSpring}
								/>
							)}
							<StageVisual machine={item} className="stage-dock-image" />
							<span className="stage-dock-name">{item.name}</span>
						</button>
					))}
				</div>
			</motion.nav>
		</div>
	);
}
