import {
	ExternalLink,
	FolderOpen,
	Globe2,
	LoaderCircle,
	LogOut,
	Moon,
	Plus,
	Search,
	Server,
	Sun,
	WifiOff,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SiDocker, SiImmich, SiJellyfin, SiPlex, SiSyncthing } from "react-icons/si";
import useSWR from "swr";
import { getTopology, topologyKey } from "@/api/inventory";
import { AddDeviceDialog } from "@/components/inventory/AddDeviceDialog";
import { AddServiceDialog } from "@/components/inventory/AddServiceDialog";
import { TopologyMap } from "@/components/topology/TopologyMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { openExternal } from "@/lib/open-external";
import { useServerStore } from "@/lib/stores/server";
import { useThemeStore } from "@/lib/stores/theme";
import type { Machine, RouterDevice, ServiceEndpoint } from "@/types/inventory";

const routerAsset = (router: RouterDevice) =>
	router.image === "router-black" ? "/devices/router-black.png" : "/devices/router-white.png";

const machineAsset: Record<string, string> = {
	nas: "/devices/nas-black.png",
	server: "/devices/server-black.png",
	laptop: "/devices/laptop.png",
	board: "/devices/single-board-computer.png",
};

function ServiceIcon({ service }: { service: ServiceEndpoint }) {
	const className = "size-5";
	switch (service.icon) {
		case "plex":
			return <SiPlex className={`${className} text-warning-foreground`} />;
		case "immich":
			return <SiImmich className={`${className} text-primary`} />;
		case "jellyfin":
			return <SiJellyfin className={`${className} text-secondary-foreground`} />;
		case "syncthing":
			return <SiSyncthing className={`${className} text-info-foreground`} />;
		case "docker":
			return <SiDocker className={`${className} text-primary`} />;
		case "files":
			return <FolderOpen className={className} />;
		default:
			return <Globe2 className={className} />;
	}
}

function MachinePreview({ machine }: { machine: Machine }) {
	const asset = machineAsset[machine.image];
	if (asset) return <img src={asset} alt="" className="h-40 w-44 object-contain drop-shadow-2xl" />;
	return <Server className="size-20 text-muted-foreground" aria-hidden="true" />;
}

function endpointLabel(rawURL: string) {
	try {
		const url = new URL(rawURL);
		return url.port ? `:${url.port}` : url.hostname;
	} catch {
		return rawURL;
	}
}

export const Home: React.FC = () => {
	const toast = useToast();
	const { mode, toggle } = useThemeStore();
	const { serverURL, disconnect } = useServerStore();
	const { data, error, isLoading, mutate } = useSWR(topologyKey(serverURL), getTopology, {
		shouldRetryOnError: false,
	});
	const routers = useMemo(() => data ?? [], [data]);
	const [selectedRouterID, setSelectedRouterID] = useState<string>();
	const [selectedMachineID, setSelectedMachineID] = useState<string>();
	const [search, setSearch] = useState("");
	const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
	const [serviceDialogOpen, setServiceDialogOpen] = useState(false);

	useEffect(() => {
		if (!routers.some((router) => router.id === selectedRouterID)) {
			setSelectedRouterID(routers[0]?.id);
			setSelectedMachineID(routers[0]?.machines[0]?.id);
		}
	}, [routers, selectedRouterID]);

	const selectedRouter = routers.find((router) => router.id === selectedRouterID) || routers[0];
	const selectedMachine = selectedRouter?.machines.find(
		(machine) => machine.id === selectedMachineID,
	);
	const visibleRouter = useMemo(() => {
		if (!selectedRouter || !search.trim()) return selectedRouter;
		const query = search.trim().toLowerCase();
		return {
			...selectedRouter,
			machines: selectedRouter.machines.filter((machine) =>
				[machine.name, machine.address, ...machine.services.map((service) => service.name)]
					.join(" ")
					.toLowerCase()
					.includes(query),
			),
		};
	}, [search, selectedRouter]);

	const openURL = useCallback(
		async (url: string, label: string) => {
			try {
				await openExternal(url);
			} catch (reason) {
				toast.error(`无法打开 ${label}`, {
					description: reason instanceof Error ? reason.message : "地址无效",
				});
			}
		},
		[toast],
	);

	const selectRouter = (router: RouterDevice) => {
		setSelectedRouterID(router.id);
		setSelectedMachineID(router.machines[0]?.id);
	};

	const refreshAfterCreate = async () => {
		await mutate();
		toast.success("已保存", { description: "拓扑已同步到 NAS 服务。" });
	};

	const serverLabel = useMemo(() => {
		try {
			return new URL(serverURL).host;
		} catch {
			return serverURL;
		}
	}, [serverURL]);

	return (
		<div className="labmap-shell">
			<aside className="labmap-sidebar">
				<header className="px-8 pt-8">
					<div className="flex items-center justify-between gap-3">
						<h1 className="text-3xl font-semibold tracking-tight">Homelab</h1>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="rounded-xl border border-border/70 bg-background/35"
								onClick={toggle}
								title={mode === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
								aria-label={mode === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
							>
								{mode === "dark" ? <Sun /> : <Moon />}
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="rounded-xl border border-border/70 bg-background/35"
								onClick={disconnect}
								title="退出当前服务器"
								aria-label="退出当前服务器"
							>
								<LogOut />
							</Button>
						</div>
					</div>
					<div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
						<span className="max-w-36 truncate" title={serverURL}>
							{serverLabel}
						</span>
						{error && (
							<>
								<span>·</span>
								<WifiOff className="size-3.5 text-warning-foreground" />
								<span className="text-warning-foreground">服务器不可用</span>
							</>
						)}
					</div>
				</header>

				<div className="relative mx-8 mt-8">
					<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="搜索设备"
						className="pl-10"
						aria-label="搜索设备"
					/>
				</div>

				<nav className="labmap-router-list" aria-label="路由器">
					{routers.map((router) => {
						const selected = router.id === selectedRouter?.id;
						return (
							<article
								key={router.id}
								className={`labmap-router-card ${selected ? "is-selected" : ""}`}
							>
								<button
									type="button"
									className="flex w-full flex-col items-center"
									onClick={() => selectRouter(router)}
									aria-pressed={selected}
								>
									<img
										src={routerAsset(router)}
										alt=""
										className="h-28 w-32 object-contain drop-shadow-xl"
									/>
									<strong className="text-lg font-semibold">{router.name}</strong>
									<span className="mt-1 text-sm text-primary">{router.machines.length} 台机器</span>
								</button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="mt-4 border-border bg-background/30"
									onClick={() => openURL(router.management_url, router.name)}
								>
									<ExternalLink />
									管理
								</Button>
							</article>
						);
					})}
				</nav>

				<Button
					type="button"
					size="lg"
					className="mx-8 mb-8 mt-auto h-16 justify-start rounded-2xl px-6 text-base shadow-xl shadow-primary/20"
					onClick={() => setDeviceDialogOpen(true)}
				>
					<Plus className="size-6" />
					添加设备
				</Button>
			</aside>

			<main className="labmap-main">
				<section className="labmap-topology" aria-busy={isLoading}>
					{isLoading ? (
						<div className="grid h-full place-items-center text-muted-foreground">
							<LoaderCircle className="size-8 animate-spin" />
						</div>
					) : visibleRouter ? (
						<TopologyMap
							router={visibleRouter}
							selectedMachineID={selectedMachineID}
							onSelectMachine={setSelectedMachineID}
							onOpenRouter={() => openURL(visibleRouter.management_url, visibleRouter.name)}
						/>
					) : (
						<div className="grid h-full place-items-center text-center text-muted-foreground">
							<div>
								<Server className="mx-auto mb-3 size-12" />
								<p>还没有路由器</p>
								<p className="mt-1 text-sm">从左下角手动添加第一台设备。</p>
							</div>
						</div>
					)}
				</section>

				<section className="labmap-detail-panel">
					{selectedMachine ? (
						<>
							<div className="labmap-machine-summary">
								<div className="topology-machine-orbit is-selected size-48">
									<MachinePreview machine={selectedMachine} />
								</div>
								<div className="mt-2 text-center">
									<h2 className="text-2xl font-semibold">{selectedMachine.name}</h2>
									<p className="mt-1 font-mono text-sm text-muted-foreground">
										{selectedMachine.address}
										<span className="mx-2">·</span>
										{selectedRouter?.name}
									</p>
									<div className="mt-3 flex items-center justify-center gap-3">
										<span className={`status-label is-${selectedMachine.status}`}>
											<span className="status-dot" />
											{selectedMachine.status === "online"
												? "在线"
												: selectedMachine.status === "offline"
													? "离线"
													: "未检测"}
										</span>
										{selectedMachine.management_url && (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="text-primary"
												onClick={() =>
													openURL(selectedMachine.management_url, selectedMachine.name)
												}
											>
												<ExternalLink />
												管理
											</Button>
										)}
									</div>
								</div>
							</div>

							<div className="labmap-services">
								<header className="flex items-center justify-between gap-4 px-1 pb-3">
									<h3 className="text-base font-medium">
										服务 · {selectedMachine.services.length}
									</h3>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setServiceDialogOpen(true)}
									>
										<Plus />
										添加服务
									</Button>
								</header>
								<div className="labmap-service-list">
									{selectedMachine.services.length ? (
										selectedMachine.services.map((service) => (
											<div key={service.id} className="labmap-service-row">
												<span className="service-icon">
													<ServiceIcon service={service} />
												</span>
												<strong className="truncate text-sm font-medium">{service.name}</strong>
												<span className="truncate font-mono text-xs text-muted-foreground">
													{endpointLabel(service.url)}
												</span>
												<span className={`status-label is-${service.status}`}>
													<span className="status-dot" />
													{service.status === "online"
														? "在线"
														: service.status === "offline"
															? "离线"
															: "未检测"}
												</span>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => openURL(service.url, service.name)}
												>
													<ExternalLink />
													打开
												</Button>
											</div>
										))
									) : (
										<button
											type="button"
											className="grid min-h-36 w-full place-items-center rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground"
											onClick={() => setServiceDialogOpen(true)}
										>
											<span>
												<Globe2 className="mx-auto mb-2 size-7" />
												这台机器还没有服务，点击添加。
											</span>
										</button>
									)}
								</div>
							</div>
						</>
					) : (
						<div className="grid h-full place-items-center text-center text-muted-foreground">
							<div>
								<Server className="mx-auto mb-3 size-10" />
								<p>选择一台机器查看服务</p>
							</div>
						</div>
					)}
				</section>
			</main>

			<AddDeviceDialog
				open={deviceDialogOpen}
				routers={routers}
				selectedRouterID={selectedRouter?.id}
				onOpenChange={setDeviceDialogOpen}
				onCreated={refreshAfterCreate}
			/>
			<AddServiceDialog
				open={serviceDialogOpen}
				machineID={selectedMachine?.id}
				machineName={selectedMachine?.name}
				onOpenChange={setServiceDialogOpen}
				onCreated={refreshAfterCreate}
			/>
		</div>
	);
};
