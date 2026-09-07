import type React from "react";
import { useEffect, useState } from "react";
import { createService, updateService } from "@/api/inventory";
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
import type { ServiceEndpoint } from "@/types/inventory";

interface AddServiceDialogProps {
	open: boolean;
	service?: ServiceEndpoint;
	machines: { id: string; name: string; address: string; routerName: string }[];
	machineID?: string;
	machineName?: string;
	onOpenChange: (open: boolean) => void;
	onCreated: (service: ServiceEndpoint) => Promise<void> | void;
}

export const AddServiceDialog: React.FC<AddServiceDialogProps> = ({
	open,
	service,
	machines,
	machineID,
	machineName,
	onOpenChange,
	onCreated,
}) => {
	const [selectedMachineID, setSelectedMachineID] = useState(machineID || "");
	const targetMachineID =
		service?.machine_id ||
		(machines.some((machine) => machine.id === selectedMachineID) ? selectedMachineID : "");
	const [name, setName] = useState("");
	const [url, setURL] = useState("");
	const [icon, setIcon] = useState("web");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (open) {
			setSelectedMachineID(service?.machine_id || machineID || "");
			setName(service?.name ?? "");
			setURL(service?.url ?? "");
			setIcon(service?.icon || "web");
			setError("");
		}
	}, [open, service, machineID]);

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!targetMachineID || saving) return;
		setSaving(true);
		setError("");
		try {
			const input = {
				name,
				url,
				icon,
				status: service?.status ?? "unknown",
				sort_order: service?.sort_order ?? 0,
			};
			const created = service
				? await updateService(service.id, input)
				: await createService(targetMachineID, input);
			await onCreated(created);
			setName("");
			setURL("");
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
			title={service ? "编辑服务" : "添加服务"}
			description={
				service
					? `修改 ${machineName || "当前机器"} 的服务信息。`
					: "选择所属机器，添加一个可直接打开的服务入口。"
			}
			onOpenChange={(next) => {
				if (!saving) onOpenChange(next);
			}}
		>
			<form className="space-y-5" onSubmit={submit}>
				{!service && (
					<div className="space-y-2">
						<Label htmlFor="service-machine">所属机器</Label>
						<Select
							value={targetMachineID}
							onValueChange={setSelectedMachineID}
							required
							disabled={saving}
						>
							<SelectTrigger id="service-machine">
								<SelectValue placeholder="选择所属机器" />
							</SelectTrigger>
							<SelectContent>
								{machines.map((machine) => (
									<SelectItem key={machine.id} value={machine.id}>
										{machine.name} · {machine.address}（{machine.routerName}）
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				<div className="space-y-2">
					<Label htmlFor="service-name">服务名称</Label>
					<Input
						id="service-name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						placeholder="Plex"
						required
						autoFocus
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="service-url">访问地址</Label>
					<Input
						id="service-url"
						type="url"
						value={url}
						onChange={(event) => setURL(event.target.value)}
						placeholder="http://192.168.1.10:32400"
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="service-icon">图标</Label>
					<Select value={icon} onValueChange={setIcon}>
						<SelectTrigger id="service-icon">
							<SelectValue placeholder="选择图标" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="web">通用 Web</SelectItem>
							<SelectItem value="plex">Plex</SelectItem>
							<SelectItem value="immich">Immich</SelectItem>
							<SelectItem value="jellyfin">Jellyfin</SelectItem>
							<SelectItem value="syncthing">Syncthing</SelectItem>
							<SelectItem value="files">File Browser</SelectItem>
							<SelectItem value="docker">Docker</SelectItem>
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
					<Button type="submit" disabled={saving || !targetMachineID}>
						{saving ? "正在保存…" : service ? "保存修改" : "添加服务"}
					</Button>
				</footer>
			</form>
		</Modal>
	);
};
