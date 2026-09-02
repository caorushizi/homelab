import type React from "react";
import { useState } from "react";
import { createService } from "@/api/inventory";
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
	machineID?: string;
	machineName?: string;
	onOpenChange: (open: boolean) => void;
	onCreated: (service: ServiceEndpoint) => Promise<void> | void;
}

export const AddServiceDialog: React.FC<AddServiceDialogProps> = ({
	open,
	machineID,
	machineName,
	onOpenChange,
	onCreated,
}) => {
	const [name, setName] = useState("");
	const [url, setURL] = useState("");
	const [icon, setIcon] = useState("web");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!machineID) return;
		setSaving(true);
		setError("");
		try {
			const created = await createService(machineID, {
				name,
				url,
				icon,
				status: "unknown",
				sort_order: 0,
			});
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
			title="添加服务"
			description={`为 ${machineName || "当前机器"} 添加一个可直接打开的管理入口。`}
			onOpenChange={onOpenChange}
		>
			<form className="space-y-5" onSubmit={submit}>
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
					<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
						取消
					</Button>
					<Button type="submit" disabled={saving || !machineID}>
						{saving ? "正在保存…" : "添加服务"}
					</Button>
				</footer>
			</form>
		</Modal>
	);
};
