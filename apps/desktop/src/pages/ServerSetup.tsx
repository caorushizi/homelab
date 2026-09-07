import { dragWindow, isMacDesktopWindow } from "@/lib/window";
import axios from "axios";
import { ArrowRight, LoaderCircle, Moon, Sun } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { checkServerConnection } from "@/api/server";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
		<main className="server-setup">
			{isMacDesktopWindow() && <div className="setup-window-bar" onMouseDown={dragWindow}></div>}
			<Button
				type="button"
				variant="outline"
				size="icon"
				className="setup-theme-toggle"
				onClick={toggle}
				aria-label={mode === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
				title={mode === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
			>
				{mode === "dark" ? <Sun /> : <Moon />}
			</Button>

			<div className="stage-background" aria-hidden="true" />

			<Card className="setup-card">
				<CardHeader className="setup-card-header">
					<CardTitle className="setup-title">连接你的服务器</CardTitle>
				</CardHeader>

				<CardContent className="setup-card-content">
					<form className="setup-form" onSubmit={submit}>
						<div className="space-y-2">
							<Label className="setup-label" htmlFor="server-url">
								服务器地址
							</Label>
							<Input
								id="server-url"
								className="setup-input"
								spellCheck={false}
								autoCapitalize="none"
								value={serverURL}
								onChange={(event) => setServerURL(event.target.value)}
								placeholder="http://192.168.1.10:3000"
								autoComplete="url"
								autoFocus
								required
							/>
						</div>

						{error && (
							<Alert variant="destructive">
								<AlertTitle>连接失败</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<Button
							type="submit"
							size="lg"
							className="stage-primary-button setup-submit"
							disabled={connecting}
						>
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
				</CardContent>
			</Card>
		</main>
	);
};
