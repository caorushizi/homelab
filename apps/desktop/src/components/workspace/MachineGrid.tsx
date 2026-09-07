import { ArrowUpRight, FileText, Server } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { Machine } from "@/types/inventory";
import { DeviceVisual, DeviceStatus } from "./DeviceVisual";

export function MachineGrid({
	machines,
	selectedID,
	onSelect,
	onNotes,
	onOpen,
}: {
	machines: Machine[];
	selectedID?: string;
	onSelect: (id: string) => void;
	onNotes: (id: string) => void;
	onOpen: (url: string, name: string) => Promise<void>;
}) {
	const reduce = useReducedMotion();
	return (
		<div className="machine-grid-scroll">
			{!machines.length ? (
				<div className="machine-grid-empty">
					<Server size={36} />
					<h2>暂无机器</h2>
					<p>可在设置页添加机器。</p>
				</div>
			) : (
				<div className="machine-grid">
					{machines.map((machine, index) => (
						<motion.article
							layout={reduce ? false : "position"}
							key={machine.id}
							className={`machine-card ${selectedID === machine.id ? "is-selected" : ""}`}
							initial={{ opacity: 0, y: reduce ? 0 : 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								duration: reduce ? 0 : 0.24,
								delay: reduce ? 0 : Math.min(index, 5) * 0.035,
							}}
						>
							<button
								className="machine-card-select"
								onClick={() => onSelect(machine.id)}
								aria-label={`查看 ${machine.name}`}
								aria-pressed={selectedID === machine.id}
							>
								<div className="machine-card-top">
									<DeviceVisual image={machine.image} className="machine-card-image" />
									<div className="machine-card-identity">
										<h2 title={machine.name}>{machine.name}</h2>
										<p title={machine.address}>{machine.address}</p>
									</div>
								</div>
								<span className="machine-card-count">
									<DeviceStatus status={machine.status} />
									<span>
										{machine.services.length} 个服务 <ArrowUpRight size={14} />
									</span>
								</span>
							</button>
							<div className="machine-card-services">
								{machine.services.length ? (
									machine.services.slice(0, 3).map((service) => (
										<button
											key={service.id}
											title={service.url}
											onClick={() => void onOpen(service.url, service.name)}
										>
											{service.name}
											<ArrowUpRight size={12} />
										</button>
									))
								) : (
									<span>暂未添加服务</span>
								)}
								{machine.services.length > 3 && (
									<button onClick={() => onSelect(machine.id)}>
										+{machine.services.length - 3}
									</button>
								)}
							</div>
							<footer>
								<button
									aria-label={`管理 ${machine.name}`}
									onClick={() => void onOpen(machine.management_url, machine.name)}
								>
									<ArrowUpRight size={15} />
									管理
								</button>
								<button aria-label={`${machine.name} 备注`} onClick={() => onNotes(machine.id)}>
									<FileText size={15} />
									备注
								</button>
							</footer>
						</motion.article>
					))}
				</div>
			)}
		</div>
	);
}
