import {
	Heading2,
	Bold,
	Italic,
	List,
	ListOrdered,
	ListTodo,
	Quote,
	Code2,
	Link2,
	Table2,
	Undo2,
	Redo2,
} from "lucide-react";
import { Fragment, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { noteExtensions } from "@/components/inventory/note-extensions";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NoteEditor({
	content,
	onChange,
}: {
	content: string;
	onChange: (markdown: string) => void;
}) {
	const [linkOpen, setLinkOpen] = useState(false);
	const [link, setLink] = useState("");
	const [error, setError] = useState("");
	const editor = useEditor({
		extensions: [
			...noteExtensions(),
			Placeholder.configure({ placeholder: "记录部署命令、端口说明或维护步骤……" }),
		],
		content,
		contentType: "markdown",
		editorProps: {
			attributes: {
				class: "note-markdown min-h-full outline-none",
				role: "textbox",
				"aria-label": "备注编辑器",
				"aria-multiline": "true",
			},
		},
		onUpdate: ({ editor }) => onChange(editor.getMarkdown()),
	});
	const active = useEditorState({
		editor,
		selector: ({ editor }) => ({
			heading: editor?.isActive("heading"),
			bold: editor?.isActive("bold"),
			italic: editor?.isActive("italic"),
			bullet: editor?.isActive("bulletList"),
			ordered: editor?.isActive("orderedList"),
			task: editor?.isActive("taskList"),
			quote: editor?.isActive("blockquote"),
			code: editor?.isActive("codeBlock"),
			table: editor?.isActive("table"),
			link: editor?.isActive("link"),
			undo: editor?.can().undo(),
			redo: editor?.can().redo(),
		}),
	});
	if (!editor) return null;
	const icons = [Heading2, Bold, Italic, List, ListOrdered, ListTodo, Quote, Code2];
	const actions = [
		{
			label: "标题",
			active: active?.heading,
			run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
		},
		{ label: "加粗", active: active?.bold, run: () => editor.chain().focus().toggleBold().run() },
		{
			label: "斜体",
			active: active?.italic,
			run: () => editor.chain().focus().toggleItalic().run(),
		},
		{
			label: "列表",
			active: active?.bullet,
			run: () => editor.chain().focus().toggleBulletList().run(),
		},
		{
			label: "编号",
			active: active?.ordered,
			run: () => editor.chain().focus().toggleOrderedList().run(),
		},
		{
			label: "任务",
			active: active?.task,
			run: () => editor.chain().focus().toggleTaskList().run(),
		},
		{
			label: "引用",
			active: active?.quote,
			run: () => editor.chain().focus().toggleBlockquote().run(),
		},
		{
			label: "代码",
			active: active?.code,
			run: () => editor.chain().focus().toggleCodeBlock().run(),
		},
	];
	const applyLink = () => {
		const value = link.trim();
		if (!value) {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			setLinkOpen(false);
			return;
		}
		try {
			const url = new URL(value);
			if (!["http:", "https:"].includes(url.protocol)) throw new Error();
		} catch {
			setError("请输入完整的 HTTP 或 HTTPS 地址");
			return;
		}
		if (editor.state.selection.empty && !editor.isActive("link"))
			editor
				.chain()
				.focus()
				.insertContent({
					type: "text",
					text: value,
					marks: [{ type: "link", attrs: { href: value } }],
				})
				.run();
		else editor.chain().focus().extendMarkRange("link").setLink({ href: value }).run();
		setLinkOpen(false);
		setError("");
	};
	return (
		<div className="note-writing-area">
			<div className="note-formatbar" role="toolbar" aria-label="备注格式">
				{actions.map((action, index) => {
					const Icon = icons[index];
					return (
						<Fragment key={action.label}>
							{(index === 3 || index === 6) && (
								<span className="note-tool-divider" aria-hidden="true" />
							)}
							<Button
								size="icon"
								className="note-tool"
								variant={action.active ? "secondary" : "ghost"}
								aria-label={action.label}
								title={action.label}
								aria-pressed={!!action.active}
								onMouseDown={(event) => event.preventDefault()}
								onClick={action.run}
							>
								<Icon />
							</Button>
						</Fragment>
					);
				})}
				<Button
					aria-pressed={!!active?.link}
					aria-label="链接"
					title="链接"
					size="icon"
					className="note-tool"
					variant={active?.link ? "secondary" : "ghost"}
					onClick={() => {
						setLink(editor.getAttributes("link").href || "");
						setError("");
						setLinkOpen(!linkOpen);
					}}
				>
					<Link2 />
				</Button>
				<Button
					aria-label="表格"
					title="表格"
					size="icon"
					className="note-tool"
					variant="ghost"
					disabled={active?.table}
					onClick={() =>
						editor.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()
					}
				>
					<Table2 />
				</Button>
				<span className="note-tool-divider note-history-divider" aria-hidden="true" />
				<Button
					aria-label="撤销"
					title="撤销"
					size="icon"
					className="note-tool"
					variant="ghost"
					disabled={!active?.undo}
					onClick={() => editor.chain().focus().undo().run()}
				>
					<Undo2 />
				</Button>
				<Button
					aria-label="重做"
					title="重做"
					size="icon"
					className="note-tool"
					variant="ghost"
					disabled={!active?.redo}
					onClick={() => editor.chain().focus().redo().run()}
				>
					<Redo2 />
				</Button>
			</div>
			{active?.table && (
				<div className="flex flex-wrap gap-1" aria-label="表格操作">
					<Button
						size="sm"
						variant="outline"
						onClick={() => editor.chain().focus().addRowAfter().run()}
					>
						添加行
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={() => editor.chain().focus().addColumnAfter().run()}
					>
						添加列
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={() => editor.chain().focus().deleteRow().run()}
					>
						删除行
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={() => editor.chain().focus().deleteColumn().run()}
					>
						删除列
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={() => editor.chain().focus().deleteTable().run()}
					>
						删除表格
					</Button>
				</div>
			)}
			{linkOpen && (
				<div className="space-y-2 rounded-lg border border-border p-2">
					<div className="flex gap-2">
						<Input
							autoFocus
							data-note-link-input
							aria-label="链接地址"
							value={link}
							placeholder="https://example.com"
							onChange={(e) => setLink(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									e.preventDefault();
									e.stopPropagation();
									setLinkOpen(false);
									editor.commands.focus();
								}
								if (e.key === "Enter") {
									e.preventDefault();
									applyLink();
								}
							}}
						/>
						<Button onClick={applyLink}>应用</Button>
						<Button variant="ghost" onClick={() => setLinkOpen(false)}>
							取消
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">留空可移除链接。{error}</p>
				</div>
			)}
			<EditorContent editor={editor} className="note-editor" />
			<p className="note-writing-hint">
				支持 Markdown 快捷输入 <span>## 标题 · - 列表 · ``` 代码块</span>
			</p>
		</div>
	);
}
