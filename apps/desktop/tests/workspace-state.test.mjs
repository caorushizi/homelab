import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyWorkspace,
  parseWorkspace,
  reconcileWorkspace,
  workspaceKey,
} from "../src/lib/workspace-state.ts";

test("first launch and corrupt saved state start at overview", () => {
  for (const raw of [null, "{", "null", '{"version":2}', '{"version":1,"viewports":null}'])
    assert.equal(parseWorkspace(raw).routerID, undefined);
});
test("workspace preserves machine, note mode and sidebar across reload", () => {
  const state = {
    ...emptyWorkspace(),
    routerID: "router-a",
    machineID: "nas",
    noteOpen: true,
    noteEditing: true,
    sidebarCollapsed: true,
  };
  assert.deepEqual(parseWorkspace(JSON.stringify(state)), state);
});
test("saved state is isolated per server", () =>
  assert.notEqual(workspaceKey("http://nas-a"), workspaceKey("http://nas-b")));
test("deleted machine closes note but preserves its router", () => {
  const state = {
    ...emptyWorkspace(),
    routerID: "r",
    machineID: "deleted",
    noteOpen: true,
  };
  const resolved = reconcileWorkspace(state, [{ id: "r", machines: [{ id: "existing" }] }]);
  assert.equal(resolved.routerID, "r");
  assert.equal(resolved.machineID, undefined);
  assert.equal(resolved.noteOpen, false);
});
test("deleted router falls back to overview", () => {
  const resolved = reconcileWorkspace(
    { ...emptyWorkspace(), routerID: "deleted", machineID: "m", noteOpen: true },
    [],
  );
  assert.equal(resolved.routerID, undefined);
  assert.equal(resolved.machineID, undefined);
  assert.equal(resolved.noteOpen, false);
});
test("legacy graph settings are discarded while retaining the selected devices", () => {
  const saved = parseWorkspace(
    JSON.stringify({
      version: 1,
      routerID: "r",
      machineID: "m",
      deviceView: "topology",
      viewports: { r: { x: 1, y: 2, zoom: 0.5 } },
    }),
  );
  assert.deepEqual(saved, { ...emptyWorkspace(), routerID: "r", machineID: "m" });
});
