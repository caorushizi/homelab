import { FileText, Check, LoaderCircle, CircleAlert, Eye, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getNote, saveNote, type MachineNote } from "@/api/notes";
import { NoteEditor } from "@/components/inventory/NoteEditor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { NotePreview } from "@/components/inventory/NotePreview";
import type { Machine } from "@/types/inventory";
import "@/styles/notes.css";

const limit = 100 * 1024;
type Draft = { content: string; revision: number };
export function MachineNoteDrawer({
	machine,
	server,
	onClose,
}: {
	machine: Machine;
	server: string;
	onClose: () => void;
}) {
	const key = `machine-note:${server}:${machine.id}`;
	const [modalOpen, setModalOpen] = useState(true);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const [content, setContent] = useState("");
	const [editing, setEditing] = useState(false);
	const [status, setStatus] = useState("加载中…");
	const [ready, setReady] = useState(false);
	const [conflict, setConflict] = useState(false);
	const [storageError, setStorageErrorState] = useState(false);
	const storageFailed = useRef(false);
	const setStorageError = (value: boolean) => {
		storageFailed.current = value;
		setStorageErrorState(value);
	};
	const [updated, setUpdated] = useState("");
	const [remote, setRemote] = useState<MachineNote>();
	const state = useRef({
		content: "",
		saved: "",
		revision: 0,
		busy: false,
		blocked: false,
		ready: false,
	});
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const alive = useRef(true);
	const persist = () => {
		try {
			localStorage.setItem(
				key,
				JSON.stringify({ content: state.current.content, revision: state.current.revision }),
			);
			setStorageError(false);
		} catch {
			setStorageError(true);
		}
	};
	const load = async () => {
		setStatus("加载中…");
		try {
			const note = await getNote(server, machine.id);
			if (!alive.current) return;
			let draft: Draft | undefined;
			try {
				const raw = localStorage.getItem(key);
				if (raw) {
					const parsed = JSON.parse(raw);
					if (typeof parsed.content === "string" && Number.isSafeInteger(parsed.revision))
						draft = parsed;
				}
			} catch {
				setStorageError(true);
			}
			const dirty = !!draft && draft.content !== note.content;
			const stale = dirty && draft!.revision !== note.revision;
			state.current = {
				content: dirty ? draft!.content : note.content,
				saved: note.content,
				revision: note.revision,
				busy: false,
				blocked: stale,
				ready: true,
			};
			setContent(state.current.content);
			setEditing(false);
			setReady(true);
			setUpdated(note.revision ? note.updated_at : "");
			setConflict(stale);
			setRemote(stale ? note : undefined);
			setStatus(stale ? "备注已在其他客户端更新，草稿已保留" : dirty ? "已恢复本地草稿" : "已保存");
			if (dirty && !stale) timer.current = setTimeout(() => void save(), 1000);
		} catch {
			if (alive.current) setStatus("加载失败，请重试");
		}
	};
	const save = async () => {
		clearTimeout(timer.current);
		const s = state.current;
		if (!s.ready || s.busy || s.blocked || s.content === s.saved) return;
		if (new TextEncoder().encode(s.content).length > limit) {
			setStatus("超过 100 KB，请缩短内容后保存");
			return;
		}
		s.busy = true;
		const submitted = s.content;
		setStatus("保存中…");
		try {
			const note = await saveNote(server, machine.id, submitted, s.revision);
			s.saved = submitted;
			s.revision = note.revision;
			if (s.content === submitted) {
				try {
					localStorage.removeItem(key);
				} catch {
					setStorageError(true);
				}
			} else persist();
			if (alive.current) {
				setUpdated(note.updated_at);
				setStatus(s.content === submitted ? "已保存" : "未保存");
			}
		} catch (error) {
			const code = (error as { code?: number }).code;
			s.blocked = code === 409;
			persist();
			if (alive.current) {
				setConflict(s.blocked);
				setStatus(
					s.blocked ? "备注已在其他客户端更新，草稿已保留" : "保存失败，草稿已保留，请重试",
				);
			}
		} finally {
			s.busy = false;
		}
		if (s.content !== submitted && !s.blocked) void save();
	};
	const change = (value: string) => {
		state.current.content = value;
		setContent(value);
		persist();
		if (!state.current.blocked) setStatus("未保存");
		clearTimeout(timer.current);
		timer.current = setTimeout(() => void save(), 1000);
	};
	useEffect(() => {
		alive.current = true;
		void load();
		const unload = (event: BeforeUnloadEvent) => {
			if (state.current.content !== state.current.saved) {
				event.preventDefault();
				event.returnValue = "";
			}
		};
		window.addEventListener("beforeunload", unload);
		return () => {
			alive.current = false;
			clearTimeout(timer.current);
			clearTimeout(closeTimer.current);
			window.removeEventListener("beforeunload", unload);
		};
	}, []);
	const close = async () => {
		await save();
		if (state.current.busy) return;
		if (storageFailed.current && state.current.content !== state.current.saved) {
			setStatus("本地草稿无法写入，请先保存成功或复制内容");
			return;
		}
		setModalOpen(false);
		closeTimer.current = setTimeout(
			onClose,
			window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180,
		);
	};
	return (
		<Dialog
			open={modalOpen}
			onOpenChange={(open) => {
				if (!open) void close();
			}}
		>
			<DialogContent
				onEscapeKeyDown={(event) => {
					if (document.activeElement?.hasAttribute("data-note-link-input")) event.preventDefault();
				}}
				className="workspace-note-modal flex h-[min(760px,calc(100dvh-2rem))] max-w-[800px] flex-col overflow-y-auto"
				onKeyDown={(event) => {
					if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
						event.preventDefault();
						void save();
					}
				}}
			>
				<div className="note-modal-heading">
					<span className="note-modal-icon">
						<FileText size={20} />
					</span>
					<div>
						<DialogTitle className="text-base">设备备注</DialogTitle>
						<DialogDescription
							className="note-device-caption"
							title={`${machine.name} · ${machine.address}`}
						>
							{machine.name}
							{machine.name !== machine.address && ` · ${machine.address}`}
						</DialogDescription>
					</div>
				</div>
				{ready && (
					<>
						<div className="note-mode-row">
							<span className="note-format-label">MARKDOWN</span>
							<div className="note-mode-switch" role="group" aria-label="备注显示模式">
								<Button
									variant="ghost"
									size="sm"
									aria-pressed={editing}
									onClick={() => setEditing(true)}
								>
									<Pencil size={14} /> 编辑
								</Button>
								<Button
									variant="ghost"
									size="sm"
									aria-pressed={!editing}
									onClick={() => setEditing(false)}
								>
									<Eye size={14} /> 预览
								</Button>
							</div>
						</div>
						{conflict && (
							<div className="space-y-2 rounded-lg border border-border bg-muted p-3 text-sm">
								<p>远端内容有更新。请先查看最新版本，再将需要的内容合并到当前草稿。</p>
								<Button
									variant="outline"
									onClick={async () => {
										try {
											setRemote(await getNote(server, machine.id));
										} catch {
											setStatus("无法读取最新版本，请重试");
										}
									}}
								>
									查看最新版本
								</Button>
								{remote && (
									<>
										<pre className="max-h-40 overflow-auto whitespace-pre-wrap">
											{remote.content || "（空备注）"}
										</pre>
										<Button
											onClick={() => {
												state.current.revision = remote.revision;
												state.current.saved = remote.content;
												state.current.blocked = false;
												setConflict(false);
												persist();
												setStatus("请合并内容后点击保存");
												setEditing(true);
											}}
										>
											以此版本为基础继续编辑
										</Button>
									</>
								)}
							</div>
						)}
						{editing ? (
							<NoteEditor content={content} onChange={change} />
						) : (
							<NotePreview content={content} onError={setStatus} />
						)}
					</>
				)}
				<footer className="note-modal-footer">
					<div role="status">
						<p className="note-save-status">
							{status === "已保存" ? (
								<Check size={14} />
							) : status === "保存中…" || status === "加载中…" ? (
								<LoaderCircle size={14} className="animate-spin" />
							) : (
								<CircleAlert size={14} />
							)}{" "}
							{status === "未保存" ? "等待自动保存…" : status}
						</p>
						{storageError && <p>本地草稿存储不可用，请保持窗口打开直到保存成功。</p>}
						{updated && (
							<p className="note-saved-time" title={new Date(updated).toLocaleString()}>
								最后保存{" "}
								{new Date(updated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
							</p>
						)}
					</div>
					{ready ? (
						<Button
							size="sm"
							variant="outline"
							disabled={conflict || status === "保存中…" || status === "已保存"}
							title="保存（⌘ / Ctrl + S）"
							onClick={() => void save()}
						>
							保存
						</Button>
					) : (
						<Button variant="outline" onClick={() => void load()}>
							重试
						</Button>
					)}
				</footer>
			</DialogContent>
		</Dialog>
	);
}
