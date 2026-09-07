import type React from "react";
import { useEffect, useState } from "react";
import { createMachine, createRouter, updateMachine, updateRouter } from "@/api/inventory";
import { Modal } from "@/components/inventory/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Machine, RouterDevice } from "@/types/inventory";

type DeviceKind = "router" | "machine";

interface AddDeviceDialogProps {
	open: boolean;
	device?: RouterDevice | Machine;
	kind: DeviceKind;
	routers: RouterDevice[];
	selectedRouterID?: string;
	onOpenChange: (open: boolean) => void;
	onCreated: (device: RouterDevice | Machine) => Promise<void> | void;
}

const AddDeviceDialog: React.FC<AddDeviceDialogProps> = ({
	kind,
	device,
	open,
	routers,
	selectedRouterID,
	onOpenChange,
	onCreated,
}) => {
	const [routerID, setRouterID] = useState(selectedRouterID || routers[0]?.id || "");
	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [managementURL, setManagementURL] = useState("");
	const [image, setImage] = useState(kind === "router" ? "router-white" : "server");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (selectedRouterID) setRouterID(selectedRouterID);
	}, [selectedRouterID]);

	useEffect(() => {
		if (open) {
			setName(device?.name ?? "");
			setAddress(device?.address ?? "");
			setManagementURL(device?.management_url ?? "");
			setImage(device?.image || (kind === "machine" ? "server" : "router-white"));
			setError("");
			setRouterID(
				device && "router_id" in device
					? device.router_id
					: selectedRouterID || routers[0]?.id || "",
			);
		}
	}, [open]);

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (saving) return;
		setSaving(true);
		setError("");
		try {
			const common = {
				name,
				address,
				management_url: managementURL,
				image,
				status: device?.status ?? "unknown",
				sort_order: device?.sort_order ?? (kind === "router" ? routers.length : 0),
			};
			const created = device
				? kind === "router"
					? await updateRouter(device.id, common)
					: await updateMachine(device.id, common)
				: kind === "router"
					? await createRouter({ ...common, image: image || "router-white" })
					: await createMachine(routerID, common);
			await onCreated(created);
			setName("");
			setAddress("");
			setManagementURL("");
			onOpenChange(false);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "保存失败，请确认 API 已启动");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Modal
			open={open}
			title={`${device ? "编辑" : "添加"}${kind === "router" ? "路由器" : "机器"}`}
			description={
				device
					? "修改设备名称、地址和外观。"
					: kind === "router"
						? "添加一个网络，管理它的设备与服务。"
						: "将机器添加到所属路由器，记录服务与维护信息。"
			}
			onOpenChange={(next) => {
				if (!saving) onOpenChange(next);
			}}
		>
			<form className="space-y-5" onSubmit={submit}>
				{kind === "machine" && (
					<div className="space-y-2">
						<Label htmlFor="device-router">所属路由器</Label>
						<Select value={routerID} onValueChange={setRouterID} required disabled={!!device}>
							<SelectTrigger id="device-router">
								<SelectValue placeholder="选择路由器" />
							</SelectTrigger>
							<SelectContent>
								{routers.map((router) => (
									<SelectItem key={router.id} value={router.id}>
										{router.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="device-name">名称</Label>
						<Input
							id="device-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder={kind === "router" ? "主路由" : "NAS"}
							required
							autoFocus
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="device-address">IP / 主机名</Label>
						<Input
							id="device-address"
							value={address}
							onChange={(event) => setAddress(event.target.value)}
							placeholder="192.168.1.10"
							required
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="device-url">管理页面</Label>
					<Input
						id="device-url"
						type="url"
						value={managementURL}
						onChange={(event) => setManagementURL(event.target.value)}
						placeholder="https://192.168.1.1"
						required={kind === "router"}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="device-image">设备外观</Label>
					<Select value={image} onValueChange={setImage}>
						<SelectTrigger id="device-image">
							<SelectValue placeholder="选择设备外观" />
						</SelectTrigger>
						<SelectContent>
							{kind === "router" ? (
								<>
									<SelectItem value="router-white">白色路由器</SelectItem>
									<SelectItem value="router-black">黑色路由器</SelectItem>
								</>
							) : (
								<>
									<SelectItem value="nas">NAS</SelectItem>
									<SelectItem value="server">服务器</SelectItem>
									<SelectItem value="home-assistant">Home Assistant</SelectItem>
									<SelectItem value="laptop">笔记本</SelectItem>
									<SelectItem value="board">单板计算机</SelectItem>
								</>
							)}
						</SelectContent>
					</Select>
				</div>

				{error && (
					<p className="rounded-xl border border-error-border bg-error-surface px-3 py-2 text-sm text-error-foreground">
						{error}
					</p>
				)}

				<footer className="flex justify-end gap-3 pt-2">
					<Button
						type="button"
						variant="ghost"
						disabled={saving}
						onClick={() => onOpenChange(false)}
					>
						取消
					</Button>
					<Button type="submit" disabled={saving || (kind === "machine" && !routerID)}>
						{saving
							? "正在保存…"
							: device
								? "保存修改"
								: kind === "router"
									? "添加路由器"
									: "添加机器"}
					</Button>
				</footer>
			</form>
		</Modal>
	);
};

type DialogProps = Omit<AddDeviceDialogProps, "kind">;
export const AddRouterDialog = (props: DialogProps) => <AddDeviceDialog {...props} kind="router" />;
export const AddMachineDialog = (props: DialogProps) => (
	<AddDeviceDialog {...props} kind="machine" />
);
