import { useState } from "react";
import {
	NodeViewContent,
	NodeViewWrapper,
	ReactNodeViewRenderer,
	type NodeViewProps,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { TableKit } from "@tiptap/extension-table";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import CodeBlock from "@tiptap/extension-code-block";

function CopyableCodeBlock({ node }: NodeViewProps) {
	const [label, setLabel] = useState("复制");
	return (
		<NodeViewWrapper className="relative">
			<button
				type="button"
				contentEditable={false}
				className="absolute right-2 top-2 z-10 rounded border border-border bg-background px-2 py-1 text-xs"
				onClick={async () => {
					try {
						await navigator.clipboard.writeText(node.textContent);
						setLabel("已复制");
					} catch {
						setLabel("复制失败");
					}
				}}
			>
				{label}
			</button>
			<pre>
				<NodeViewContent<"code"> as="code" />
			</pre>
		</NodeViewWrapper>
	);
}

// Editing and preview share the same Markdown schema.
export function noteExtensions(readOnly = false) {
	return [
		StarterKit.configure({ link: { openOnClick: false }, underline: false, codeBlock: false }),
		Markdown,
		TableKit.configure({ table: { resizable: false } }),
		TaskList,
		TaskItem.configure({ nested: true }),
		readOnly
			? CodeBlock.extend({
					addNodeView() {
						return ReactNodeViewRenderer(CopyableCodeBlock);
					},
				})
			: CodeBlock,
	];
}
