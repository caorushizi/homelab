import { useEffect, useRef, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DeviceVisual } from "./DeviceVisual";
import type { Machine, RouterDevice } from "@/types/inventory";

export function StageSearch({
	routers,
	query,
	onQuery,
	onChoose,
	disabled,
}: {
	routers: RouterDevice[];
	query: string;
	onQuery: (query: string) => void;
	onChoose: (router: RouterDevice, machineID?: string) => void;
	disabled: boolean;
}) {
	const input = useRef<HTMLInputElement>(null);
	const [focused, setFocused] = useState(false);
	const [active, setActive] = useState(-1);
	const normalized = query.trim().toLowerCase();
	const results: { router: RouterDevice; machine?: Machine }[] = normalized
		? routers
				.flatMap((router) => [
					...([router.name, router.address].some((text) => text.toLowerCase().includes(normalized))
						? [{ router }]
						: []),
					...router.machines
						.filter((machine) =>
							[
								machine.name,
								machine.address,
								...machine.services.flatMap((service) => [service.name, service.url]),
							].some((text) => text.toLowerCase().includes(normalized)),
						)
						.map((machine) => ({ router, machine })),
				])
				.slice(0, 12)
		: [];
	const expanded = !!normalized && focused;
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (!disabled && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				input.current?.focus();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [disabled]);
	useEffect(() => {
		if (expanded && active >= 0)
			document.getElementById(`stage-search-${active}`)?.scrollIntoView({ block: "nearest" });
	}, [active, expanded]);
	function choose(result: (typeof results)[number]) {
		setFocused(false);
		setActive(-1);
		input.current?.blur();
		onChoose(result.router, result.machine?.id);
	}
	return (
		<div
			className="stage-search"
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false);
			}}
		>
			<Search aria-hidden="true" size={16} />
			<Input
				ref={input}
				className="h-9 rounded-xl border-[var(--stage-line)] bg-[var(--stage-glass)] pl-10 pr-12 text-[var(--stage-ink)] shadow-none placeholder:text-[var(--stage-muted)]"
				role="combobox"
				aria-label="搜索路由器、设备或服务"
				aria-autocomplete="list"
				aria-expanded={expanded}
				aria-controls={expanded ? "stage-search-results" : undefined}
				aria-activedescendant={expanded && results[active] ? `stage-search-${active}` : undefined}
				placeholder="搜索设备或服务"
				value={query}
				onFocus={() => setFocused(true)}
				onChange={(event) => {
					onQuery(event.target.value);
					setActive(-1);
					setFocused(true);
				}}
				onKeyDown={(event) => {
					if (event.nativeEvent.isComposing) return;
					if (event.key === "Escape") {
						event.preventDefault();
						onQuery("");
						setActive(-1);
						setFocused(false);
						input.current?.blur();
					}
					if ((event.key === "ArrowDown" || event.key === "ArrowUp") && results.length) {
						event.preventDefault();
						setFocused(true);
						setActive((current) =>
							event.key === "ArrowDown"
								? (current + 1) % results.length
								: current <= 0
									? results.length - 1
									: current - 1,
						);
					}
					if (event.key === "Enter" && results.length) {
						event.preventDefault();
						choose(results[active] ?? results[0]);
					}
				}}
			/>
			{query ? (
				<button
					className="stage-search-clear"
					aria-label="清除搜索"
					onClick={() => {
						onQuery("");
						setActive(-1);
						input.current?.focus();
					}}
				>
					<X size={16} />
				</button>
			) : (
				<kbd>{/Mac/i.test(navigator.platform) ? "⌘ K" : "Ctrl K"}</kbd>
			)}
			{expanded && (
				<div className="stage-search-popover">
					<div
						className="stage-search-results"
						id="stage-search-results"
						role="listbox"
						aria-label="搜索结果"
					>
						{results.map((result, index) => (
							<button
								id={`stage-search-${index}`}
								key={`${result.router.id}:${result.machine?.id ?? "router"}`}
								role="option"
								aria-selected={index === active}
								tabIndex={-1}
								onMouseDown={(event) => event.preventDefault()}
								onClick={() => choose(result)}
							>
								<DeviceVisual
									image={result.machine?.image ?? result.router.image}
									router={!result.machine}
									className="stage-search-image"
								/>
								<span>
									<strong>{result.machine?.name ?? result.router.name}</strong>
									<small>
										{result.router.name} · {result.machine?.address ?? result.router.address}
									</small>
								</span>
								<ArrowRight size={16} />
							</button>
						))}
					</div>
					{!results.length && <p role="status">没有找到匹配的设备或服务</p>}
				</div>
			)}
		</div>
	);
}
