# Aurora workspace design QA

final result: passed

## Visual truth and evidence

- Workbench reference: `/Users/diaozhenyuan/.codex/generated_images/01a07c9b-0943-7c63-ada8-f5ff4a46df92/exec-e32e81c8-a824-455a-8eb2-a737d43964e2.png`
- Overview reference: `/Users/diaozhenyuan/.codex/generated_images/01a07c9b-0943-7c63-ada8-f5ff4a46df92/exec-43095293-ef4d-45d5-9231-3cd63c9e5e30.png`
- Implementation: `http://127.0.0.1:5174`, isolated test API on port 3011.
- Screenshots: `docs/design/aurora/overview.png`, `workbench.png`, `workbench-light.png`, `notes.png`, `mobile.png`.
- Desktop CSS viewport and capture: 1440 × 1024, screenshot density 1. References: 1487 × 1058, same aspect ratio; compared at equivalent full-frame scale, excluding no browser chrome.
- Mobile CSS viewport and capture: 390 × 844. This is a responsive extension with no mobile source mockup.
- Overview state: three routers. Workbench state: main router, five machines, NAS selected with three services. References contain illustrative counts and assets; API data is authoritative.
- Source and implementation were opened together in the same comparison tool input for both overview and workbench. Full-view comparison checked hierarchy, panel proportions, density and assets. Control labels and service rows were readable at full resolution, so no additional crops were required.

## Findings and comparison history

No remaining actionable P0/P1/P2 findings.

Earlier findings corrected during browser review:

1. P2: overview grid left an unused fourth column. Changed to auto-fit tracks; overview screenshot shows three evenly sized cards.
2. P2: search icon overlapped entered text. Added explicit input padding; search tested with service-name navigation.
3. P1: reset stylesheet made React Flow edge SVGs zero width. Scoped SVG dimensions restore visible connections in workbench screenshot.
4. P2: focusing a machine scrolled the shell and cropped the toolbar. Shell uses overflow clip; full toolbar remains visible after selection.
5. P2: default React Flow controls and attribution had unreadable theme contrast. Scoped theme overrides now show legible controls and attribution.
6. P1: mounting the overview during startup could overwrite saved selection. Startup redirect now completes before Home mounts. Opening `/` restores router and NAS selection.
7. P2: hover-driven node reconstruction interfered with selection. Hover styling is CSS-only; single-click selection verified.
8. P2: empty inspector covered narrow-screen topology. Empty inspector is hidden below 900px; populated inspector can be collapsed.
9. P2: mobile icon buttons lost their icons to inherited padding. Explicit responsive padding and accessible names restore add and management controls.
10. P2: lower topology connections crossed router labels. Side source handles now route below-router connections around labels.

Post-fix evidence is recorded in the final workbench, overview and mobile screenshots. Notes drawer was opened and closed after adding its exit transition.

## Required fidelity surfaces

- Typography: system sans-serif Chinese fallback, clear display/body hierarchy, monospace addresses. Actual fonts are sharper and more compact than generated text; intentional for a working desktop tool. Truncation is used for long router/device labels.
- Spacing: three-column overview and sidebar/canvas/inspector workbench preserve the selected composition. Compact sidebar gives more usable canvas space. Narrow windows use icon navigation and an overlay inspector.
- Color: navy surfaces and blue/violet/cyan theme tokens; reduced aurora intensity keeps text readable. Light theme independently checked. Unknown device status remains neutral rather than falsely showing online.
- Images: generated raster aurora plus existing device PNG assets, Lucide controls and existing service icons. Real device types replace mockup placeholders, including the third router that the generated mock incorrectly depicted as a NAS.
- Copy: Homelab branding retained; router names, addresses and counts come from API data. Notes, search, service and management actions use task-specific labels.

## Interaction and validation checklist

- [x] Overview to router detail; return to overview.
- [x] Direct router switching, including empty router.
- [x] Service-name search jumps to its machine and router.
- [x] Single-click machine selection, canvas zoom and fit.
- [x] Reload and fresh root navigation restore saved location; camera transform matches before/after reload.
- [x] Notes editing and saved content displayed; drawer closes smoothly.
- [x] Add-device form retains router association and correct initial device kind.
- [x] Light theme and narrow-window layout checked.
- [x] Console inspected after full reload: no application errors. React Flow development hot-reload warning was eliminated by full reload; node/edge type maps are module constants.
- [x] Six persistence tests passed, including corrupt data and deleted device/router fallback.
- [x] Lint, format and TypeScript/production build passed.

## Residual limits

Native Tauri process termination/relaunch was not exercised; persistence was verified through full browser reload and fresh root navigation on the same origin. Production build reports an existing large vendor chunk warning; no build errors. Generated reference lighting is intentionally quieter in the implementation to meet the user's request for elegant motion. Reduced-motion handling is implemented; operating-system accessibility preference was not toggled during browser QA.

## Device cards revision — 2026-09-08

The user approved replacing the default topology with device cards while retaining a topology toggle. This intentionally supersedes the previous workbench composition; the original mock is no longer a layout-fidelity target for the default view.

- Evidence: `docs/design/aurora/device-cards.png` (1440 × 1024).
- Cards expose status, address, service count, up to three direct service links, management and notes. Additional services remain available in the inspector.
- An unselected machine no longer reserves an empty inspector column. Selecting a card reveals details; closing details returns the space to the cards.
- Browser verified: default cards after upgrading old state, device selection, inspector collapse, direct NAS note entry with existing content, topology toggle and persistence across full navigation, empty router, 390 × 844 narrow layout.
- Motion: short view fades and small entrance offsets, position transitions during card rearrangement, CSS hover feedback; reduced-motion preference respected.
- Validation: lint, format, production build, seven persistence tests and diff whitespace checks. Vendor size warning remains.
