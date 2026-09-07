import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ExternalLink,
	LoaderCircle,
	LogOut,
	Moon,
	Network,
	Settings,
	Sun,
	WifiOff,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, MotionConfig, useReducedMotion } from "motion/react";
import { useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";
import { getTopology, topologyKey } from "@/api/inventory";
import { MachineNoteViewer } from "@/components/inventory/MachineNoteViewer";
import { DeviceVisual } from "@/components/workspace/DeviceVisual";
import { DeviceStage } from "@/components/workspace/DeviceStage";
import { StageSearch } from "@/components/workspace/StageSearch";
import { useToast } from "@/hooks/useToast";
import { openExternal } from "@/lib/open-external";
import { stageSelectionSpring } from "@/lib/stage-motion";
import { useServerStore } from "@/lib/stores/server";
import { useThemeStore } from "@/lib/stores/theme";
import {
	readWorkspace,
	reconcileWorkspace,
	writeWorkspace,
	type WorkspaceState,
} from "@/lib/workspace-state";
import { dragWindow, isMacDesktopWindow } from "@/lib/window";
import type { RouterDevice } from "@/types/inventory";

const routerTones = ["violet", "blue", "teal", "rose", "amber"] as const;

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
	const routerIndex = routers.findIndex((item) => item.id === routerID);
	const router = routers[routerIndex];
	const tone = routerTones[Math.max(0, routerIndex) % routerTones.length];
	const machine =
		router?.machines.find((item) => item.id === workspace.machineID) ?? router?.machines[0];
	const [search, setSearch] = useState("");
	useEffect(() => {
		if (!data || error) return;
		const saved = savedRef.current;
		const target =
			data.find((item) => item.id === routerID) ??
			data.find((item) => item.id === saved.routerID) ??
			data[0];
		const current =
			saved.routerID === target?.id
				? saved
				: { ...saved, routerID: target?.id, machineID: undefined, noteOpen: false };
		const valid = reconcileWorkspace(current, data);
		if (
			valid.routerID !== saved.routerID ||
			valid.machineID !== saved.machineID ||
			valid.noteOpen !== saved.noteOpen
		)
			updateWorkspace(valid);
		if (target && target.id !== routerID)
			navigate(`/routers/${encodeURIComponent(target.id)}`, { replace: true });
		else if (!target && routerID) navigate("/", { replace: true });
	}, [data, error, routerID, navigate, updateWorkspace]);
	useEffect(() => {
		const visibility = () =>
			document.documentElement.toggleAttribute("data-app-paused", document.hidden);
		document.addEventListener("visibilitychange", visibility);
		visibility();
		return () => {
			document.removeEventListener("visibilitychange", visibility);
			document.documentElement.removeAttribute("data-app-paused");
		};
	}, []);
	const openURL = useCallback(
		async (url: string, name: string) => {
			try {
				await openExternal(url);
			} catch {
				toast.error(`无法打开 ${name}`);
			}
		},
		[toast],
	);
	function enterRouter(target: RouterDevice, machineID?: string) {
		updateWorkspace({
			routerID: target.id,
			machineID: machineID ?? target.machines[0]?.id,
			noteOpen: false,
			detailCollapsed: false,
		});
		setSearch("");
		navigate(`/routers/${encodeURIComponent(target.id)}`);
	}
	function openSettings() {
		navigate("/settings", {
			state: { from: routerID ? `/routers/${encodeURIComponent(routerID)}` : "/" },
		});
	}
	return (
		<MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 300, damping: 32 }}>
			<LayoutGroup id="violet-workspace">
				<div className="violet-workspace" data-stage-tone={tone}>
					<div className="stage-background" aria-hidden="true" />
					<aside className="stage-sidebar">
						<div
							className={`stage-drag-region ${isMacDesktopWindow() ? "has-native-controls" : ""}`}
							onMouseDown={dragWindow}
						/>
						<div className="stage-brand">
							<Network size={24} />
							<span>Homelab</span>
						</div>
						<nav className="stage-router-nav" aria-label="路由器切换">
							{routers.map((item) => (
								<div className="stage-router-item" key={item.id}>
									{routerID === item.id && (
										<motion.div
											className="stage-router-selection"
											layoutId="stage-router-selection"
											transition={reduce ? { duration: 0 } : stageSelectionSpring}
										/>
									)}
									<button
										className="stage-router-button"
										aria-current={routerID === item.id ? "page" : undefined}
										aria-label={`切换到 ${item.name}`}
										title={item.name}
										onClick={() => enterRouter(item)}
									>
										<DeviceVisual image={item.image} router className="stage-router-image" />
										<span>{item.name}</span>
									</button>
									<button
										className="stage-router-admin"
										aria-label={`管理 ${item.name}`}
										title="打开路由器管理页"
										disabled={!item.management_url}
										onClick={() => void openURL(item.management_url, item.name)}
									>
										<ExternalLink size={14} />
									</button>
								</div>
							))}
						</nav>
						<footer className="stage-sidebar-footer">
							<button className="stage-settings" aria-label="设置" onClick={openSettings}>
								<Settings size={24} />
								<span>设置</span>
							</button>
							<button
								className="stage-utility"
								onClick={toggle}
								aria-label={mode === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
								title={mode === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
							>
								{mode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
							</button>
							<button
								className="stage-utility"
								aria-label="退出当前服务器"
								title={serverURL}
								onClick={() => {
									navigate("/", { replace: true });
									disconnect();
								}}
							>
								<LogOut size={18} />
							</button>
						</footer>
					</aside>
					<main className="stage-main">
						<header className="stage-topbar" onMouseDown={dragWindow}>
							<StageSearch
								routers={routers}
								query={search}
								onQuery={setSearch}
								onChoose={enterRouter}
								disabled={workspace.noteOpen}
							/>
						</header>
						{error && (
							<div className="stage-error" role="alert">
								<WifiOff size={16} />
								<span>服务器暂时不可用，已保留当前工作位置。</span>
								<button onClick={() => void mutate()}>重新连接</button>
							</div>
						)}
						{isLoading && !data ? (
							<div className="stage-empty" role="status">
								<LoaderCircle className="animate-spin" size={30} />
								<p>正在连接你的网络…</p>
							</div>
						) : (
							<AnimatePresence mode="wait" initial={false}>
								{router ? (
									<motion.div
										className="stage-router-content"
										key={router.id}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: reduce ? 0 : 0.16 }}
									>
										{machine ? (
											<DeviceStage
												machines={router.machines}
												machine={machine}
												onSelect={(id) => updateWorkspace({ machineID: id, noteOpen: false })}
												onOpen={openURL}
												onNotes={() => updateWorkspace({ machineID: machine.id, noteOpen: true })}
											/>
										) : (
											<div className="stage-empty">
												<DeviceVisual image={router.image} router className="stage-empty-router" />
												<h1>{router.name}</h1>
												<p>暂无机器</p>
												<button className="stage-primary-button" onClick={openSettings}>
													前往设置
												</button>
											</div>
										)}
									</motion.div>
								) : (
									<div className="stage-empty" key="unavailable">
										<Network size={40} />
										<p>
											{error
												? "连接恢复后将回到你的工作台。"
												: routers.length
													? "正在恢复工作台…"
													: "从第一台路由器开始"}
										</p>
										{!error && !routers.length && (
											<button className="stage-primary-button" onClick={openSettings}>
												前往设置
											</button>
										)}
									</div>
								)}
							</AnimatePresence>
						)}
					</main>
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
