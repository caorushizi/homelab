import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
	Table,
	TableHeader,
	TableBody,
	TableRow,
	TableHead,
	TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useSWR from "swr";
import {
	ArrowLeft,
	FileText,
	LoaderCircle,
	Network,
	Pencil,
	Plus,
	Search,
	Server,
	Globe2,
	Trash2,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { deleteInventory, getTopology, topologyKey } from "@/api/inventory";
import { AddRouterDialog, AddMachineDialog } from "@/components/inventory/AddDeviceDialog";
import { AddServiceDialog } from "@/components/inventory/AddServiceDialog";
import { MachineNoteDrawer } from "@/components/inventory/MachineNoteDrawer";
import { Modal } from "@/components/inventory/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { useServerStore } from "@/lib/stores/server";
import { dragWindow, isMacDesktopWindow } from "@/lib/window";
import type { Machine, RouterDevice, ServiceEndpoint } from "@/types/inventory";

type Kind = "router" | "machine" | "service";
type EditTarget =
	| { kind: "router"; value?: RouterDevice }
	| { kind: "machine"; value?: Machine }
	| { kind: "service"; value?: ServiceEndpoint };
type DeleteTarget = { kind: Kind; id: string; name: string; description: string };
const tabs = [
	{ kind: "router", label: "路由器", icon: Network },
	{ kind: "machine", label: "机器", icon: Server },
	{ kind: "service", label: "服务", icon: Globe2 },
] as const;

export function SettingsPage() {
	const server = useServerStore((state) => state.serverURL);
	const { data, error, isLoading, mutate } = useSWR(topologyKey(server), getTopology, {
		shouldRetryOnError: false,
	});
	const routers = useMemo(() => data ?? [], [data]);
	const machines = useMemo(
		() =>
			routers.flatMap((router) =>
				router.machines.map((machine) => ({ ...machine, routerName: router.name })),
			),
		[routers],
	);
	const services = useMemo(
		() =>
			machines.flatMap((machine) =>
				machine.services.map((service) => ({
					...service,
					machineName: machine.name,
					routerID: machine.router_id,
					routerName: machine.routerName,
				})),
			),
		[machines],
	);
	const navigate = useNavigate();
	const location = useLocation();
	const reduce = useReducedMotion();
	const toast = useToast();
	const [kind, setKind] = useState<Kind>("router");
	const [routerFilter, setRouterFilter] = useState("");
	const [machineFilter, setMachineFilter] = useState("");
	const [search, setSearch] = useState("");
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const openEditor = (target: EditTarget) => {
		setEdit(target);
		setEditOpen(true);
	};
	const [edit, setEdit] = useState<EditTarget>();
	const [deleting, setDeleting] = useState<DeleteTarget>();
	const [busy, setBusy] = useState(false);
	const [deleteError, setDeleteError] = useState("");
	const [noteID, setNoteID] = useState<string>();
	const noteMachine = machines.find((machine) => machine.id === noteID);
	// Resolve stale filters after deletion or a concurrent inventory update.
	const routerID = routers.some((router) => router.id === routerFilter) ? routerFilter : "";
	const scopedMachines = machines.filter((machine) => !routerID || machine.router_id === routerID);
	const machineID = scopedMachines.some((machine) => machine.id === machineFilter)
		? machineFilter
		: "";
	const serviceMachineID =
		edit?.kind === "service" && edit.value ? edit.value.machine_id : machineID;
	const serviceMachine = machines.find((machine) => machine.id === serviceMachineID);
	const query = search.trim().toLowerCase();
	const matches = (...values: string[]) =>
		values.some((value) => value.toLowerCase().includes(query));
	const visibleRouters = routers.filter((router) => matches(router.name, router.address));
	const visibleMachines = scopedMachines.filter((machine) =>
		matches(machine.name, machine.address, machine.routerName),
	);
	const visibleServices = services.filter(
		(service) =>
			(!routerID || service.routerID === routerID) &&
			(!machineID || service.machine_id === machineID) &&
			matches(service.name, service.url, service.machineName, service.routerName),
	);
	const count =
		kind === "router"
			? visibleRouters.length
			: kind === "machine"
				? visibleMachines.length
				: visibleServices.length;
	const label = tabs.find((tab) => tab.kind === kind)!.label;
	const canCreate =
		!error &&
		!isLoading &&
		(kind === "router" || (kind === "machine" ? routers.length > 0 : machines.length > 0));
	const saved = async () => {
		toast.success(edit?.value ? "修改已保存" : "添加成功");
		try {
			await mutate();
		} catch {
			toast.error("数据已保存，列表刷新失败，请重试刷新。");
		}
	};
	const askDelete = (target: DeleteTarget) => {
		setDeleteError("");
		setDeleting(target);
		setDeleteOpen(true);
	};
	const confirmDelete = async () => {
		if (!deleting || busy) return;
		setBusy(true);
		setDeleteError("");
		try {
			await deleteInventory(deleting.kind, deleting.id);
			setDeleteOpen(false);
			toast.success("已删除");
			try {
				await mutate();
			} catch {
				toast.error("删除成功，列表刷新失败，请重试刷新。");
			}
		} catch (reason) {
			setDeleteError(reason instanceof Error ? reason.message : "删除失败，请重试。");
		} finally {
			setBusy(false);
		}
	};
	const back = () => {
		const from = location.state?.from;
		navigate(
			typeof from === "string" && (from === "/" || from.startsWith("/routers/")) ? from : "/",
		);
	};
	const editButton = (target: EditTarget, name: string) => (
		<Button
			size="sm"
			variant="ghost"
			disabled={!!error}
			onClick={() => openEditor(target)}
			aria-label={`编辑 ${name}`}
		>
			<Pencil className="size-3.5" />
			编辑
		</Button>
	);
	const deleteButton = (target: DeleteTarget) => (
		<Button
			size="sm"
			variant="ghost"
			className="text-destructive"
			disabled={!!error || busy}
			onClick={() => askDelete(target)}
			aria-label={`删除 ${target.name}`}
		>
			<Trash2 className="size-3.5" />
			删除
		</Button>
	);
	return (
		<div className="settings-shell">
			<header className="settings-topbar" onMouseDown={dragWindow}>
				{isMacDesktopWindow() && (
					<div className="native-window-space" aria-hidden="true" onMouseDown={dragWindow} />
				)}
				<Button variant="ghost" size="sm" onClick={back}>
					<ArrowLeft className="size-4" />
					返回浏览
				</Button>
				<span className="text-sm font-medium">设置</span>
			</header>
			<main className="settings-main">
				<div className="settings-title">
					<h1>设备与服务</h1>
					<p>管理你的路由器、机器、服务与维护备注。</p>
				</div>
				<Tabs
					value={kind}
					onValueChange={(value) => {
						setKind(value as Kind);
						setSearch("");
					}}
				>
					<TabsList
						className="settings-tabs h-auto w-full justify-start rounded-none bg-transparent p-0"
						aria-label="设置分类"
					>
						{tabs.map((tab) => (
							<TabsTrigger
								className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
								key={tab.kind}
								value={tab.kind}
								onClick={() => {
									setKind(tab.kind);
									setSearch("");
								}}
							>
								<tab.icon className="size-4" />
								{tab.label}
								<Badge variant="secondary" className="rounded-md px-1.5 py-0 text-xs">
									{tab.kind === "router"
										? routers.length
										: tab.kind === "machine"
											? machines.length
											: services.length}
								</Badge>
							</TabsTrigger>
						))}
					</TabsList>
					<TabsContent key={kind} value={kind}>
						{error && (
							<Alert variant="destructive" className="settings-error flex">
								<AlertDescription>无法获取最新数据，请检查服务器连接。</AlertDescription>
								<Button size="sm" variant="outline" onClick={() => void mutate().catch(() => {})}>
									重试刷新
								</Button>
							</Alert>
						)}
						<div className="settings-filters">
							<Label className="settings-search">
								<Search className="size-4" />
								<Input
									className="h-9 pl-9"
									aria-label={`搜索${label}`}
									placeholder={`搜索${label}名称或地址`}
									value={search}
									onChange={(event) => setSearch(event.target.value)}
								/>
							</Label>
							{kind !== "router" && (
								<Select
									value={routerID || "all"}
									onValueChange={(value) => {
										setRouterFilter(value === "all" ? "" : value);
										setMachineFilter("");
									}}
								>
									<SelectTrigger aria-label="筛选路由器" className="h-9 w-[180px]">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">全部路由器</SelectItem>
										{routers.map((router) => (
											<SelectItem key={router.id} value={router.id}>
												{router.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
							{kind === "service" && (
								<Select
									value={machineID || "all"}
									onValueChange={(value) => setMachineFilter(value === "all" ? "" : value)}
								>
									<SelectTrigger aria-label="筛选机器" className="h-9 w-[240px]">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">全部机器</SelectItem>
										{scopedMachines.map((machine) => (
											<SelectItem key={machine.id} value={machine.id}>
												{machine.name} · {machine.address}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
							<Button size="sm" disabled={!canCreate} onClick={() => openEditor({ kind })}>
								<Plus className="size-4" />
								添加{label}
							</Button>
						</div>
						{kind === "service" && !machines.length && !isLoading && !error && (
							<p className="settings-hint">请先在“机器”中添加一台机器。</p>
						)}
						{kind === "machine" && !routers.length && !isLoading && !error && (
							<p className="settings-hint">请先在“路由器”中添加一个路由器。</p>
						)}
						<motion.section
							key={kind}
							initial={{ opacity: 0, y: reduce ? 0 : 4 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: reduce ? 0 : 0.16 }}
							className="settings-panel"
							aria-label={`${label}管理`}
						>
							{isLoading && !data ? (
								<div className="settings-empty">
									<LoaderCircle className="size-5 animate-spin" />
									正在加载…
								</div>
							) : count === 0 ? (
								<div className="settings-empty">
									<p>{query ? "没有匹配的结果" : `暂无${label}`}</p>
									<span>{query ? "尝试其他名称或清除搜索。" : "添加后可在浏览页面查看。"}</span>
								</div>
							) : (
								<div className="settings-table-scroll">
									<Table className="settings-table">
										<TableHeader>
											<TableRow>
												<TableHead>名称</TableHead>
												<TableHead>{kind === "service" ? "访问地址" : "IP / 主机名"}</TableHead>
												<TableHead>{kind === "router" ? "设备与服务" : "所属设备"}</TableHead>
												<TableHead className="settings-actions-heading text-right">操作</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{kind === "router" &&
												visibleRouters.map((router) => (
													<TableRow key={router.id}>
														<TableCell>
															<Button
																variant="link"
																className="settings-name h-auto whitespace-normal p-0"
																onClick={() => {
																	setRouterFilter(router.id);
																	setMachineFilter("");
																	setKind("machine");
																	setSearch("");
																}}
															>
																{router.name}
															</Button>
														</TableCell>
														<TableCell className="settings-address">{router.address}</TableCell>
														<TableCell>
															{router.machines.length} 台机器 ·{" "}
															{router.machines.reduce(
																(total, machine) => total + machine.services.length,
																0,
															)}{" "}
															个服务
														</TableCell>
														<TableCell>
															<div className="settings-row-actions">
																{editButton({ kind: "router", value: router }, router.name)}
																{deleteButton({
																	kind: "router",
																	id: router.id,
																	name: router.name,
																	description: `将删除该路由器及其 ${router.machines.length} 台机器、${router.machines.reduce((total, machine) => total + machine.services.length, 0)} 个服务和所有机器备注。此操作无法撤销。`,
																})}
															</div>
														</TableCell>
													</TableRow>
												))}
											{kind === "machine" &&
												visibleMachines.map((machine) => (
													<TableRow key={machine.id}>
														<TableCell>
															<Button
																variant="link"
																className="settings-name h-auto whitespace-normal p-0"
																onClick={() => {
																	setRouterFilter(machine.router_id);
																	setMachineFilter(machine.id);
																	setKind("service");
																	setSearch("");
																}}
															>
																{machine.name}
															</Button>
															<small>{machine.services.length} 个服务</small>
														</TableCell>
														<TableCell className="settings-address">{machine.address}</TableCell>
														<TableCell>{machine.routerName}</TableCell>
														<TableCell>
															<div className="settings-row-actions">
																<Button
																	size="sm"
																	variant="ghost"
																	onClick={() => setNoteID(machine.id)}
																	aria-label={`修改 ${machine.name} 备注`}
																>
																	<FileText className="size-3.5" />
																	备注
																</Button>
																{editButton({ kind: "machine", value: machine }, machine.name)}
																{deleteButton({
																	kind: "machine",
																	id: machine.id,
																	name: machine.name,
																	description: `将删除该机器、其 ${machine.services.length} 个服务及维护备注。此操作无法撤销。`,
																})}
															</div>
														</TableCell>
													</TableRow>
												))}
											{kind === "service" &&
												visibleServices.map((service) => (
													<TableRow key={service.id}>
														<TableCell>
															<span className="font-medium">{service.name}</span>
														</TableCell>
														<TableCell className="settings-address">{service.url}</TableCell>
														<TableCell>
															{service.machineName}
															<small>{service.routerName}</small>
														</TableCell>
														<TableCell>
															<div className="settings-row-actions">
																{editButton({ kind: "service", value: service }, service.name)}
																{deleteButton({
																	kind: "service",
																	id: service.id,
																	name: service.name,
																	description:
																		"将移除此服务入口，不会卸载机器上的软件。此操作无法撤销。",
																})}
															</div>
														</TableCell>
													</TableRow>
												))}
										</TableBody>
									</Table>
								</div>
							)}
						</motion.section>
						<p className="settings-hint">共 {count} 项</p>
					</TabsContent>
				</Tabs>
			</main>
			{edit?.kind === "router" && (
				<AddRouterDialog
					open={editOpen}
					routers={routers}
					device={edit.value}
					onOpenChange={(open) => {
						setEditOpen(open);
					}}
					onCreated={saved}
				/>
			)}
			{edit?.kind === "machine" && (
				<AddMachineDialog
					open={editOpen}
					routers={routers}
					device={edit.value}
					selectedRouterID={routerID}
					onOpenChange={(open) => {
						setEditOpen(open);
					}}
					onCreated={saved}
				/>
			)}
			{edit?.kind === "service" && (
				<AddServiceDialog
					open={editOpen}
					service={edit.value}
					machineID={serviceMachineID}
					machines={machines}
					machineName={serviceMachine?.name}
					onOpenChange={(open) => {
						setEditOpen(open);
					}}
					onCreated={saved}
				/>
			)}
			{noteMachine && (
				<MachineNoteDrawer
					key={`${server}:${noteMachine.id}`}
					machine={noteMachine}
					server={server}
					onClose={() => setNoteID(undefined)}
				/>
			)}
			<Modal
				open={deleteOpen}
				title={`删除“${deleting?.name ?? ""}”？`}
				description={deleting?.description ?? ""}
				onOpenChange={(open) => {
					if (!open && !busy) setDeleteOpen(false);
				}}
			>
				{deleteError && (
					<p role="alert" className="text-sm text-destructive">
						{deleteError}
					</p>
				)}
				<div className="flex justify-end gap-2">
					<Button variant="outline" disabled={busy} onClick={() => setDeleteOpen(false)}>
						取消
					</Button>
					<Button variant="destructive" disabled={busy} onClick={() => void confirmDelete()}>
						{busy ? "正在删除…" : "确认删除"}
					</Button>
				</div>
			</Modal>
		</div>
	);
}
