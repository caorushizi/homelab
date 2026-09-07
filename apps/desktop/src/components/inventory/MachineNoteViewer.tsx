import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { LoaderCircle } from "lucide-react";
import { getNote } from "@/api/notes";
import { NotePreview } from "./NotePreview";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import type { Machine } from "@/types/inventory";

export function MachineNoteViewer({
	machine,
	server,
	onClose,
}: {
	machine: Machine;
	server: string;
	onClose: () => void;
}) {
	const [open, setOpen] = useState(true);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	useEffect(() => () => clearTimeout(closeTimer.current), []);
	const close = () => {
		if (closeTimer.current) return;
		setOpen(false);
		closeTimer.current = setTimeout(
			onClose,
			window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180,
		);
	};
	const toast = useToast();
	const { data, error, isLoading, mutate } = useSWR(
		["machine-note-preview", server, machine.id],
		() => getNote(server, machine.id),
		{ revalidateOnMount: true },
	);
	return (
		<Dialog
			open={open}
			onOpenChange={(open) => {
				if (!open) close();
			}}
		>
			<DialogContent className="flex h-[min(760px,calc(100dvh-2rem))] max-w-[800px] flex-col overflow-hidden">
				<DialogHeader className="pr-10">
					<DialogTitle>设备备注</DialogTitle>
					<DialogDescription>
						{machine.name} · {machine.address}
					</DialogDescription>
				</DialogHeader>
				{isLoading ? (
					<div className="flex flex-1 items-center justify-center">
						<LoaderCircle className="animate-spin" aria-label="加载备注" />
					</div>
				) : error ? (
					<div role="alert" className="space-y-3">
						<p>备注加载失败。</p>
						<Button variant="outline" onClick={() => void mutate()}>
							重试
						</Button>
					</div>
				) : data?.content ? (
					<NotePreview
						key={`${machine.id}:${data.revision}`}
						content={data.content}
						onError={(message) => toast.error(message)}
					/>
				) : (
					<div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
						暂无备注，可在设置页记录。
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
