// Critical damping keeps both selection indicators smooth without overshooting.
export const stageSelectionSpring = {
	type: "spring",
	stiffness: 360,
	damping: 2 * Math.sqrt(360),
	mass: 1,
} as const;
