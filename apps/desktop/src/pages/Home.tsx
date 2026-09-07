import { dragWindow, isMacDesktopWindow } from "@/lib/window";
import {
	ArrowLeft,
	ArrowRight,
	ExternalLink,
	Layers3,
	LoaderCircle,
	LogOut,
	Moon,
	Network,
	PanelLeftClose,
	PanelLeftOpen,
	PanelRightOpen,
	Settings,
	Search,
	Sun,
	WifiOff,
	X,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, MotionConfig, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";
import { getTopology, topologyKey } from "@/api/inventory";
import { MachineNoteViewer } from "@/components/inventory/MachineNoteViewer";
import { DeviceStatus, DeviceVisual } from "@/components/workspace/DeviceVisual";
import { MachineGrid } from "@/components/workspace/MachineGrid";
import { MachineInspector } from "@/components/workspace/MachineInspector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { openExternal } from "@/lib/open-external";
import { useServerStore } from "@/lib/stores/server";
import { useThemeStore } from "@/lib/stores/theme";
import {
	readWorkspace,
	reconcileWorkspace,
	writeWorkspace,
	type WorkspaceState,
} from "@/lib/workspace-state";
import type { Machine, RouterDevice } from "@/types/inventory";

export function Home() {
	const { serverURL, disconnect } = useServerStore();
	const { mode, toggle } = useThemeStore();
	const toast = useToast();
	const { routerID } = useParams();
	const navigate = useNavigate();
	const reduce = useReducedMotion();
	const [workspace, setWorkspace] = useState(() => readWorkspace(serverURL));
	const savedRef = useRef(workspace);
	const persistenceWarning = useRef(false);
	const updateWorkspace = useCallback(
		(patch: Partial<WorkspaceState>) => {
			const next = { ...savedRef.current, ...patch };
			savedRef.current = next;
			setWorkspace(next);
			if (!writeWorkspace(serverURL, next) && !persistenceWarning.current) {
				persistenceWarning.current = true;
				toast.error("无法保存浏览位置", { description: "本地存储不可用，当前操作仍可继续。" });
			}
		},
		[serverURL, toast],
	);
	const { data, error, isLoading, mutate } = useSWR(topologyKey(serverURL), getTopology, {
		shouldRetryOnError: false,
	});
	const routers = useMemo(() => data ?? [], [data]);
	const router = routers.find((item) => item.id === routerID);
	const machine = router?.machines.find((item) => item.id === workspace.machineID);
	const [search, setSearch] = useState("");
	const [searchFocused, setSearchFocused] = useState(false);
	const searchInput = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (savedRef.current.routerID !== routerID)
			updateWorkspace({ routerID, machineID: undefined, noteOpen: false });
	}, [routerID, updateWorkspace]);
	useEffect(() => {
		if (!data || error) return;
		const current = { ...savedRef.current, routerID };
		const valid = reconcileWorkspace(current, data);
		if (valid.routerID !== routerID) {
			updateWorkspace(valid);
			navigate("/", { replace: true });
		} else if (valid.machineID !== current.machineID || valid.noteOpen !== current.noteOpen)
			updateWorkspace(valid);
	}, [data, error, routerID, navigate, updateWorkspace]);
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (
				(event.metaKey || event.ctrlKey) &&
				event.key.toLowerCase() === "k" &&
				!savedRef.current.noteOpen
			) {
				event.preventDefault();
				searchInput.current?.focus();
			}
		};
		const visibility = () =>
			document.documentElement.toggleAttribute("data-app-paused", document.hidden);
		document.addEventListener("keydown", onKey);
		document.addEventListener("visibilitychange", visibility);
		visibility();
		return () => {
			document.removeEventListener("keydown", onKey);
			document.removeEventListener("visibilitychange", visibility);
			document.documentElement.removeAttribute("data-app-paused");
		};
	}, []);
	const openURL = useCallback(
		async (url: string, label: string) => {
			try {
				await openExternal(url);
			} catch {
				toast.error(`无法打开 ${label}`);
			}
		},
		[toast],
	);
	const enterRouter = (target: RouterDevice, machineID?: string) => {
		updateWorkspace({ routerID: target.id, machineID, noteOpen: false, detailCollapsed: false });
		setSearch("");
		setSearchFocused(false);
		navigate(`/routers/${encodeURIComponent(target.id)}`);
	};
	const overview = () => {
		updateWorkspace({ routerID: undefined, machineID: undefined, noteOpen: false });
		setSearch("");
		navigate("/");
	};
	const query = search.trim().toLowerCase();
	const results = useMemo(
		() =>
			routers
				.flatMap((item) => {
					const matched = item.machines.filter((m) =>
						[m.name, m.address, ...m.services.flatMap((s) => [s.name, s.url])].some((value) =>
							value.toLowerCase().includes(query),
						),
					);
					return [
						...([item.name, item.address].some((value) => value.toLowerCase().includes(query))
							? [{ router: item, machine: undefined as Machine | undefined }]
							: []),
						...matched.map((m) => ({ router: item, machine: m })),
					];
				})
				.slice(0, 12),
		[routers, query],
	);
	const visibleRouters = query
		? routers.filter((item) =>
				[
					item.name,
					item.address,
					...item.machines.flatMap((m) => [m.name, m.address, ...m.services.map((s) => s.name)]),
				].some((value) => value.toLowerCase().includes(query)),
			)
		: routers;
	const serverLabel = (() => {
		try {
			return new URL(serverURL).host;
		} catch {
			return serverURL;
		}
	})();
	const spring = { type: "spring" as const, stiffness: 300, damping: 32, mass: 0.8 };
	const selectMachine = useCallback(
		(id: string) => updateWorkspace({ machineID: id, detailCollapsed: false }),
		[updateWorkspace],
	);

	return (
		<MotionConfig reducedMotion="user" transition={spring}>
			<LayoutGroup id="homelab">
				<div className="aurora-shell">
					<div className="aurora-backdrop" aria-hidden="true" />
					<header className="workspace-topbar" onMouseDown={dragWindow}>
						{isMacDesktopWindow() && (
							<div className="native-window-space" aria-hidden="true" onMouseDown={dragWindow} />
						)}
						<button className="workspace-brand" onClick={overview} aria-label="Homelab 路由器总览">
							<span>
								<Network className="size-6" />
							</span>
							Homelab
						</button>
						<span className="server-address" title={serverURL}>
							<span className={`connection-dot ${error ? "is-error" : ""}`} />
							{serverLabel}
						</span>
						<div
							className="workspace-search"
							onBlur={(event) => {
								if (!event.currentTarget.contains(event.relatedTarget as Node))
									setSearchFocused(false);
							}}
						>
							<Search className="size-4" />
							<Input
								ref={searchInput}
								className="pl-10 pr-14"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								onFocus={() => setSearchFocused(true)}
								onKeyDown={(event) => {
									if (event.key === "Escape") {
										setSearch("");
										searchInput.current?.blur();
									}
									if (event.key === "Enter" && query && results[0])
										enterRouter(results[0].router, results[0].machine?.id);
								}}
								aria-label="搜索路由器、设备或服务"
								placeholder="搜索路由器、设备或服务"
								aria-expanded={!!query && searchFocused}
								aria-controls="workspace-search-results"
							/>
							{search ? (
								<button onClick={() => setSearch("")} aria-label="清除搜索">
									<X className="size-4" />
								</button>
							) : (
								<kbd>⌘ K</kbd>
							)}
							{query && searchFocused && (
								<div id="workspace-search-results" className="workspace-search-results">
									<p>搜索结果 · {results.length}</p>
									{results.map((result) => (
										<button
											key={`${result.router.id}:${result.machine?.id || "router"}`}
											onClick={() => enterRouter(result.router, result.machine?.id)}
										>
											<DeviceVisual
												router={!result.machine}
												image={result.machine?.image || result.router.image}
												className="size-9 object-contain"
											/>
											<span>
												<strong>{result.machine?.name || result.router.name}</strong>
												<small>
													{result.router.name} · {result.machine?.address || result.router.address}
												</small>
											</span>
											<ArrowRight className="size-4" />
										</button>
									))}
									{!results.length && <p>没有找到匹配的设备或服务。</p>}
								</div>
							)}
						</div>
						<div className="workspace-tools">
							<Button
								className="primary-action max-sm:px-0"
								aria-label="设置"
								onClick={() =>
									navigate("/settings", {
										state: { from: routerID ? `/routers/${encodeURIComponent(routerID)}` : "/" },
									})
								}
							>
								<Settings className="shrink-0" />
								<span>设置</span>
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={toggle}
								aria-label={mode === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
							>
								{mode === "dark" ? <Sun /> : <Moon />}
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									navigate("/", { replace: true });
									disconnect();
								}}
								aria-label="退出当前服务器"
							>
								<LogOut />
							</Button>
						</div>
					</header>
					{error && (
						<div className="workspace-error" role="alert">
							<WifiOff className="size-4" />
							<span>服务器暂时不可用。上次的工作位置已保留。</span>
							<Button size="sm" variant="ghost" onClick={() => void mutate()}>
								重新连接
							</Button>
						</div>
					)}
					{isLoading && !data ? (
						<div className="workspace-loading">
							<LoaderCircle className="size-6 animate-spin" />
							<p>正在连接你的网络…</p>
						</div>
					) : (
						<AnimatePresence mode="popLayout" initial={false}>
							{!routerID ? (
								<motion.main
									key="overview"
									className="router-overview"
									initial={{ opacity: 0, y: reduce ? 0 : 14 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: reduce ? 0 : -8 }}
									transition={{ duration: reduce ? 0 : 0.24 }}
								>
									<div className="overview-section-heading">
										<h1>
											路由器 <span>/ {routers.length.toString().padStart(2, "0")}</span>
										</h1>
										<span>
											{routers.reduce((sum, item) => sum + item.machines.length, 0)}{" "}
											台机器，尽在掌握
										</span>
									</div>
									<div className="router-grid">
										{visibleRouters.map((item, index) => (
											<motion.article
												key={item.id}
												className="overview-router"
												initial={{ opacity: 0, y: reduce ? 0 : 18 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{
													...spring,
													delay: reduce ? 0 : Math.min(index * 0.045, 0.22),
												}}
												style={{ "--card-index": index } as CSSProperties}
											>
												<button
													className="overview-router-main"
													onClick={() => enterRouter(item)}
													aria-label={`进入 ${item.name} 工作台`}
												>
													<motion.div
														layoutId={reduce ? undefined : `router-visual-${item.id}`}
														className="overview-router-image"
													>
														<DeviceVisual image={item.image} router className="router-hero-image" />
													</motion.div>
													<h3 title={item.name}>{item.name}</h3>
													<p className="mono">{item.address}</p>
													<div className="router-counts">
														<Layers3 className="size-4" />
														{item.machines.length} 台机器<span>·</span>
														{item.machines.reduce((sum, m) => sum + m.services.length, 0)} 个服务
													</div>
													<DeviceStatus status={item.status} />
													<span className="enter-workspace">
														进入工作台 <ArrowRight className="size-4" />
													</span>
												</button>
												<Button
													variant="ghost"
													className="router-manage"
													onClick={() => void openURL(item.management_url, item.name)}
												>
													打开管理页
													<ExternalLink className="size-3.5" />
												</Button>
											</motion.article>
										))}
									</div>
									{!visibleRouters.length && (
										<div className="workspace-empty">
											<Network className="size-12" />
											<h2>{query ? "没有匹配的路由器" : "从第一台路由器开始"}</h2>
											<p>
												{query
													? "试试设备名称、地址或服务名称。"
													: "连接设备，整理服务，记录每一次维护。"}
											</p>
											<Button onClick={() => (query ? setSearch("") : navigate("/settings"))}>
												{query ? "清除搜索" : "前往设置"}
											</Button>
										</div>
									)}
									{!!visibleRouters.length && (
										<footer className="overview-footer">
											<span>HOMELAB / YOUR PERSONAL NETWORK</span>
										</footer>
									)}
								</motion.main>
							) : router ? (
								<motion.main
									key="workbench"
									className={`router-workbench ${workspace.sidebarCollapsed ? "sidebar-collapsed" : ""} ${workspace.detailCollapsed || !machine ? "detail-collapsed" : ""}`}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: reduce ? 0 : 0.2 }}
								>
									<aside className="workspace-sidebar">
										<div className="sidebar-heading">
											{!workspace.sidebarCollapsed && (
												<Button
													className="sidebar-overview max-[900px]:hidden"
													variant="ghost"
													size="sm"
													onClick={overview}
													title="全部路由器"
												>
													<ArrowLeft />
													<span>全部路由器</span>
												</Button>
											)}
											<Button
												variant="ghost"
												size="icon"
												title={workspace.sidebarCollapsed ? "展开路由器列表" : "收起路由器列表"}
												aria-expanded={!workspace.sidebarCollapsed}
												aria-label={
													workspace.sidebarCollapsed ? "展开路由器列表" : "收起路由器列表"
												}
												onClick={() =>
													updateWorkspace({ sidebarCollapsed: !workspace.sidebarCollapsed })
												}
											>
												{workspace.sidebarCollapsed ? (
													<PanelLeftOpen className="size-4" />
												) : (
													<PanelLeftClose className="size-4" />
												)}
											</Button>
										</div>
										<nav aria-label="路由器切换">
											{routers.map((item) => (
												<div
													key={item.id}
													className={`sidebar-router ${item.id === routerID ? "is-selected" : ""}`}
												>
													{item.id === routerID && (
														<motion.div
															className="sidebar-selection"
															layoutId="sidebar-selection"
															transition={spring}
														/>
													)}
													<button
														className="sidebar-router-button"
														aria-label={`切换到 ${item.name}`}
														aria-current={item.id === routerID ? "page" : undefined}
														title={item.name}
														onClick={() => enterRouter(item)}
													>
														<motion.div layoutId={reduce ? undefined : `router-visual-${item.id}`}>
															<DeviceVisual
																image={item.image}
																router
																className="sidebar-router-image"
															/>
														</motion.div>
														<span>
															<strong>{item.name}</strong>
															<small>{item.machines.length} 台机器</small>
														</span>
													</button>
													<button
														className="sidebar-manage"
														aria-label={`管理 ${item.name}`}
														onClick={() => void openURL(item.management_url, item.name)}
													>
														<ExternalLink className="size-3.5" />
														<span>管理</span>
													</button>
												</div>
											))}
										</nav>
									</aside>
									<section className="workbench-canvas">
										<header className="canvas-header">
											<div>
												<p className="eyebrow">DEVICE WORKSPACE</p>
												<h1>{router.name}</h1>
											</div>
											<div className="canvas-actions">
												<Button
													variant="outline"
													size="sm"
													className="max-sm:px-0"
													aria-label="管理路由器"
													onClick={() => void openURL(router.management_url, router.name)}
												>
													<ExternalLink className="shrink-0" />
													<span className="max-sm:hidden">管理路由器</span>
												</Button>
												{workspace.detailCollapsed && machine && (
													<Button
														size="icon"
														variant="outline"
														aria-label="展开设备详情"
														onClick={() => updateWorkspace({ detailCollapsed: false })}
													>
														<PanelRightOpen className="size-4" />
													</Button>
												)}
											</div>
										</header>
										<div className="device-view-toolbar">
											<span>{router.address}</span>
										</div>
										<AnimatePresence mode="wait" initial={false}>
											<motion.div
												key={router.id}
												className="device-view-body"
												initial={{ opacity: 0, y: reduce ? 0 : 5 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0 }}
												transition={{ duration: reduce ? 0 : 0.16 }}
											>
												<MachineGrid
													machines={router.machines}
													selectedID={machine?.id}
													onSelect={selectMachine}
													onOpen={openURL}
													onNotes={(id) =>
														updateWorkspace({
															machineID: id,
															detailCollapsed: false,
															noteOpen: true,
														})
													}
												/>
											</motion.div>
										</AnimatePresence>
									</section>
									{!workspace.detailCollapsed && machine && (
										<MachineInspector
											machine={machine}
											routerName={router.name}
											onOpen={openURL}
											onNotes={() => updateWorkspace({ noteOpen: true })}
											onCollapse={() => updateWorkspace({ detailCollapsed: true })}
										/>
									)}
								</motion.main>
							) : (
								<motion.div key="missing" className="workspace-empty">
									<Network className="size-10" />
									<p>{error ? "连接恢复后将回到你的工作台。" : "正在恢复工作台…"}</p>
									<Button variant="outline" onClick={overview}>
										全部路由器
									</Button>
								</motion.div>
							)}
						</AnimatePresence>
					)}
					{workspace.noteOpen && machine && (
						<MachineNoteViewer
							key={`${serverURL}:${machine.id}`}
							machine={machine}
							server={serverURL}
							onClose={() => updateWorkspace({ noteOpen: false })}
						/>
					)}
				</div>
			</LayoutGroup>
		</MotionConfig>
	);
}
