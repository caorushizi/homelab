import { dragWindow, isMacDesktopWindow } from "@/lib/window";
import axios from "axios";
import { ArrowRight, Database, LoaderCircle, Moon, ShieldCheck, Sun } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { checkServerConnection } from "@/api/server";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useServerStore } from "@/lib/stores/server";
import { useThemeStore } from "@/lib/stores/theme";

export const ServerSetup: React.FC = () => {
	const connect = useServerStore((state) => state.connect);
	const { mode, toggle } = useThemeStore();
	const [serverURL, setServerURL] = useState("");
	const [connecting, setConnecting] = useState(false);
	const [error, setError] = useState("");

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		setConnecting(true);
		setError("");
		try {
			const result = await checkServerConnection(serverURL);
			connect(result.serverURL);
		} catch (reason) {
			if (axios.isAxiosError(reason)) {
				setError(
					reason.response?.data?.message || "无法连接到服务器，请检查地址、端口和后端状态。",
				);
			} else {
				setError(reason instanceof Error ? reason.message : "服务器地址无效");
			}
		} finally {
			setConnecting(false);
		}
	};

	return (
		<main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-5 py-10 text-foreground">
			{isMacDesktopWindow() && <div className="setup-window-bar" onMouseDown={dragWindow}></div>}
			<Button
				type="button"
				variant="outline"
				size="icon"
				className="absolute right-6 top-6 rounded-xl bg-background/70 backdrop-blur-xl"
				onClick={toggle}
				aria-label={mode === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
				title={mode === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
			>
				{mode === "dark" ? <Sun /> : <Moon />}
			</Button>

			<div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_50%_20%,var(--hero-glow-primary),transparent_38%)]" />

			<Card className="relative z-10 w-full max-w-xl border-border/80 bg-card/82 shadow-2xl backdrop-blur-2xl">
				<CardHeader className="items-center px-8 pb-5 pt-8 text-center">
					<div className="mb-3 grid size-20 place-items-center rounded-3xl border border-primary/25 bg-primary/10 text-primary shadow-xl shadow-primary/15">
						<Database className="size-9" />
					</div>
					<p className="text-sm font-medium tracking-[0.24em] text-primary uppercase">Homelab</p>
					<CardTitle className="text-3xl">连接你的服务器</CardTitle>
					<CardDescription className="max-w-md text-base">
						设备和服务数据保存在 NAS 上。首次进入前，请填写 Homelab API 的局域网地址。
					</CardDescription>
				</CardHeader>

				<CardContent className="px-8 pb-8">
					<form className="space-y-5" onSubmit={submit}>
						<div className="space-y-2">
							<Label htmlFor="server-url">服务器地址</Label>
							<Input
								id="server-url"
								value={serverURL}
								onChange={(event) => setServerURL(event.target.value)}
								placeholder="http://192.168.1.10:3000"
								autoComplete="url"
								autoFocus
								required
							/>
							<p className="text-xs leading-5 text-muted-foreground">
								可以填写 IP、域名或反向代理地址；未填协议时默认使用 HTTP。
							</p>
						</div>

						{error && (
							<Alert variant="destructive">
								<AlertTitle>连接失败</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<Button type="submit" size="lg" className="h-12 w-full text-base" disabled={connecting}>
							{connecting ? (
								<>
									<LoaderCircle className="animate-spin" />
									正在检查服务器…
								</>
							) : (
								<>
									连接并进入
									<ArrowRight />
								</>
							)}
						</Button>
					</form>

					<div className="mt-6 flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/45 p-4 text-sm text-muted-foreground">
						<ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
						<p>服务器地址只保存在这台电脑上。进入主界面后可以随时退出并更换服务器。</p>
					</div>
				</CardContent>
			</Card>
		</main>
	);
};
