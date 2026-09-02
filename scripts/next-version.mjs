import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));
const bump = process.argv[2] || "patch";
if (!["patch", "minor", "major"].includes(bump)) {
	throw new Error(`Unsupported version bump: ${bump}`);
}

const tags = execFileSync("git", ["tag", "--list", "v[0-9]*", "--sort=-v:refname"], {
	cwd: workspaceRoot,
	encoding: "utf8",
})
	.split("\n")
	.map((tag) => tag.trim())
	.filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag));

const desktopPackage = JSON.parse(
	readFileSync(`${workspaceRoot}/apps/desktop/package.json`, "utf8"),
);
const baseVersion = tags[0]?.slice(1) || desktopPackage.version;
const parts = baseVersion.split(".").map(Number);
if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) {
	throw new Error(`Invalid base version: ${baseVersion}`);
}

let [major, minor, patch] = parts;
if (bump === "major") {
	major += 1;
	minor = 0;
	patch = 0;
} else if (bump === "minor") {
	minor += 1;
	patch = 0;
} else {
	patch += 1;
}

process.stdout.write(`${major}.${minor}.${patch}`);
