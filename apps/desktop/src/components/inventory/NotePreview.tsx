import { EditorContent, useEditor } from "@tiptap/react";
import { noteExtensions } from "@/components/inventory/note-extensions";
import { openExternal } from "@/lib/open-external";

export function NotePreview({
	content,
	onError,
}: {
	content: string;
	onError: (message: string) => void;
}) {
	const editor = useEditor({
		extensions: noteExtensions(true),
		editable: false,
		content: content || "暂无备注，点击编辑开始记录。",
		contentType: "markdown",
		editorProps: {
			attributes: { class: "note-markdown outline-none", "aria-label": "备注预览" },
			handleClick: (_view, _pos, event) => {
				const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
				if (!link) return false;
				event.preventDefault();
				const href = link.getAttribute("href");
				if (href) void openExternal(href).catch(() => onError("无法打开此链接"));
				return true;
			},
		},
	});
	return <EditorContent editor={editor} className="note-preview min-h-0 flex-1 overflow-auto" />;
}
