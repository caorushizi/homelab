import { Server } from "lucide-react";
import { SiHomeassistant } from "react-icons/si";
const assets: Record<string, string> = {
	nas: "/devices/nas-black.png",
	server: "/devices/server-black.png",
	laptop: "/devices/laptop.png",
	board: "/devices/single-board-computer.png",
	"router-white": "/devices/router-white.png",
	"router-black": "/devices/router-black.png",
};
export function DeviceVisual({
	image,
	router = false,
	className = "",
}: {
	image: string;
	router?: boolean;
	className?: string;
}) {
	if (image === "home-assistant" && !router)
		return <SiHomeassistant className={className} aria-hidden="true" />;
	const src = router
		? image === "router-black"
			? assets["router-black"]
			: assets["router-white"]
		: assets[image];
	return src ? (
		<img src={src} alt="" draggable={false} className={className} />
	) : (
		<Server className={className} aria-hidden="true" />
	);
}
export function DeviceStatus({ status }: { status: string }) {
	return (
		<span className={`status-label is-${status}`}>
			<span className="status-dot" />
			{status === "online" ? "在线" : status === "offline" ? "离线" : "未检测"}
		</span>
	);
}
