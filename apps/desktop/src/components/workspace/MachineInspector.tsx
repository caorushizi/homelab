import {
	ArrowUpRight,
	Copy,
	ExternalLink,
	FileText,
	FolderOpen,
	Globe2,
	PanelRightClose,
	Server,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { SiDocker, SiImmich, SiJellyfin, SiPlex, SiSyncthing } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { DeviceVisual, DeviceStatus } from "./DeviceVisual";
import type { Machine, ServiceEndpoint } from "@/types/inventory";
import { useToast } from "@/hooks/useToast";
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
	return <Icon className="size-5" />;
}
export function MachineInspector({
	machine,
	routerName,
	onOpen,
	onNotes,
	onCollapse,
}: {
	machine?: Machine;
	routerName: string;
	onOpen: (url: string, label: string) => void;
	onNotes: () => void;
	onCollapse: () => void;
}) {
	const reduce = useReducedMotion();
	const toast = useToast();
	const copy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success("地址已复制");
		} catch {
			toast.error("无法复制地址");
		}
	};
	return (
		<aside className={`machine-inspector ${machine ? "" : "is-empty"}`} aria-label="机器详情">
			<div className="inspector-heading">
				<span>设备详情</span>
				<Button variant="ghost" size="icon" onClick={onCollapse} aria-label="收起设备详情">
					<PanelRightClose className="size-4" />
				</Button>
			</div>
			{machine ? (
				<motion.div
					key={machine.id}
					className="inspector-content"
					initial={{ opacity: 0, y: reduce ? 0 : 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: reduce ? 0 : 0.24 }}
				>
					<div className="inspector-device">
						<div className="inspector-orbit">
							<DeviceVisual image={machine.image} className="inspector-device-image" />
						</div>
						<p className="eyebrow">{routerName}</p>
						<button
							className="copy-address"
							title="复制设备地址"
							onClick={() => void copy(machine.address)}
						>
							<span>{machine.address}</span>
							<Copy className="size-3.5" />
						</button>
					</div>
					<div className="inspector-status">
						{machine.management_url && (
							<Button
								size="sm"
								variant="ghost"
								onClick={() => onOpen(machine.management_url, machine.name)}
							>
								<ExternalLink />
								管理
							</Button>
						)}
					</div>
					<div className="service-heading">
						<h3>服务</h3>
					</div>
					<div className="inspector-services">
						{machine.services.map((service) => (
							<motion.div layout={!reduce} key={service.id} className="workspace-service">
								<span className="service-icon">
									<ServiceIcon service={service} />
								</span>
								<div className="service-description">
									<strong title={service.name}>{service.name}</strong>
									<button
										className="service-url"
										title={`复制 ${service.url}`}
										onClick={() => void copy(service.url)}
									>
										{service.url}
									</button>
									<DeviceStatus status={service.status} />
								</div>
								<Button
									variant="ghost"
									size="icon"
									title={`打开 ${service.name}`}
									aria-label={`打开 ${service.name}`}
									onClick={() => onOpen(service.url, service.name)}
								>
									<ExternalLink className="size-4" />
								</Button>
							</motion.div>
						))}
						{!machine.services.length && (
							<div className="service-empty">
								<Globe2 />
								<span>暂无服务</span>
								<small>可在设置页添加服务</small>
							</div>
						)}
					</div>
					<button className="notes-launch" onClick={onNotes}>
						<span className="notes-launch-icon">
							<FileText />
						</span>
						<span>
							<strong>设备备注</strong>
							<small>部署步骤、配置与维护记录</small>
						</span>
						<ArrowUpRight className="size-4 text-primary" />
					</button>
				</motion.div>
			) : (
				<div className="workspace-empty">
					<Server className="size-10" />
					<h2>选择一台机器</h2>
					<p>选择设备卡片，查看服务与维护笔记。</p>
				</div>
			)}
		</aside>
	);
}
