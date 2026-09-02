import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version || "")) {
	throw new Error(`Invalid release version: ${version || "<missing>"}`);
}

const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));

function updateJSON(relativePath, update) {
	const path = `${workspaceRoot}/${relativePath}`;
	const original = readFileSync(path, "utf8");
	const value = JSON.parse(original);
	const firstIndentedLine = original.split("\n").find((line) => /^\s+"/.test(line)) || "  ";
	const indentation = firstIndentedLine.startsWith("\t") ? "\t" : 2;
	update(value);
	writeFileSync(path, `${JSON.stringify(value, null, indentation)}\n`);
}

function replaceRequired(relativePath, pattern, replacement) {
	const path = `${workspaceRoot}/${relativePath}`;
	const original = readFileSync(path, "utf8");
	if (!pattern.test(original)) {
		throw new Error(`Version pattern was not found in ${relativePath}`);
	}
	const updated = original.replace(pattern, replacement);
	writeFileSync(path, updated);
}

updateJSON("package.json", (value) => {
	value.version = version;
});
updateJSON("apps/desktop/package.json", (value) => {
	value.version = version;
});
updateJSON("apps/desktop/src-tauri/tauri.conf.json", (value) => {
	value.version = version;
});
updateJSON("one.manifest.json", (value) => {
	for (const project of value.projects || []) project.buildVersion = version;
});

replaceRequired(
	"apps/desktop/src-tauri/Cargo.toml",
	/(\[package\][\s\S]*?\nversion\s*=\s*")[^"]+("\n)/,
	`$1${version}$2`,
);
replaceRequired(
	"apps/desktop/src-tauri/Cargo.lock",
	/(\[\[package\]\]\nname = "labmap-desktop"\nversion = ")[^"]+("\n)/,
	`$1${version}$2`,
);

const openAPIPath = `${workspaceRoot}/services/api/api/openapi.yaml`;
const openAPILines = readFileSync(openAPIPath, "utf8").split("\n");
const infoIndex = openAPILines.findIndex((line) => line === "info:");
const pathsIndex = openAPILines.findIndex((line) => line === "paths:");
const versionIndex = openAPILines.findIndex(
	(line, index) => index > infoIndex && index < pathsIndex && line.trimStart().startsWith("version:"),
);
if (infoIndex < 0 || pathsIndex < 0 || versionIndex < 0) {
	throw new Error("OpenAPI info.version was not found");
}
openAPILines[versionIndex] = `  version: ${version}`;
writeFileSync(openAPIPath, openAPILines.join("\n"));

process.stdout.write(`Updated release version to ${version}\n`);
