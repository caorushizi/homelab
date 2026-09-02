import type React from "react";
import { useEffect, useState } from "react";
import { createMachine, createRouter } from "@/api/inventory";
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
	routers: RouterDevice[];
	selectedRouterID?: string;
	onOpenChange: (open: boolean) => void;
	onCreated: (device: RouterDevice | Machine) => Promise<void> | void;
}

export const AddDeviceDialog: React.FC<AddDeviceDialogProps> = ({
	open,
	routers,
	selectedRouterID,
	onOpenChange,
	onCreated,
}) => {
	const [kind, setKind] = useState<DeviceKind>(routers.length ? "machine" : "router");
	const [routerID, setRouterID] = useState(selectedRouterID || routers[0]?.id || "");
	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [managementURL, setManagementURL] = useState("");
	const [image, setImage] = useState("server");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (selectedRouterID) setRouterID(selectedRouterID);
	}, [selectedRouterID]);

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		setSaving(true);
		setError("");
		try {
			const common = {
				name,
				address,
				management_url: managementURL,
				image,
				status: "unknown" as const,
				sort_order: kind === "router" ? routers.length : 0,
			};
			const created =
				kind === "router"
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
			title="添加设备"
			description="手动录入路由器或连接到路由器的机器。"
			onOpenChange={onOpenChange}
		>
			<form className="space-y-5" onSubmit={submit}>
				<div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
					{(["router", "machine"] as const).map((value) => (
						<Button
							key={value}
							type="button"
							size="sm"
							variant={kind === value ? "secondary" : "ghost"}
							className="w-full"
							onClick={() => setKind(value)}
						>
							{value === "router" ? "路由器" : "机器"}
						</Button>
					))}
				</div>

				{kind === "machine" && (
					<div className="space-y-2">
						<Label htmlFor="device-router">所属路由器</Label>
						<Select value={routerID} onValueChange={setRouterID} required>
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
					<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
						取消
					</Button>
					<Button type="submit" disabled={saving || (kind === "machine" && !routerID)}>
						{saving ? "正在保存…" : "添加设备"}
					</Button>
				</footer>
			</form>
		</Modal>
	);
};
