# Device stage design QA

final result: passed

## Latest revision: router themes and desktop density

The user requested removal of the all-router page, router-dependent theme colors, and smaller controls on high-resolution displays. These changes supersede the initial mock's oversized navigation and full-window scaling.

- Removed the overview UI and its navigation entry. `/` restores the saved router and device; a successful inventory load resolves missing selections to the saved valid router or first available router. Empty inventory retains a setup action, and fetch failures preserve saved state.
- Five router tones (violet, blue, teal, rose, amber) are assigned in inventory order. Background hue, sidebar highlights, accents, primary actions, and NAS rim lighting follow the active tone. Existing reduced-motion handling disables transitions. All stage colors are scoped to `.violet-workspace`, including light/dark variants.
- Replaced viewport-dependent element sizing with capped logical dimensions. Sidebar: 224 px; router row: 92 px; device heading: 36 px; hero: at most 380 × 320 px; primary button: 190 × 44 px; dock target: 104 × 108 px. The central workbench is bounded to 1040 × 760 px. Small-window breakpoints retain scrollable device navigation.
- Before editing, the live browser reported 1196 × 964 CSS pixels, devicePixelRatio 2, visual viewport scale 1. The previous sidebar measured 257 px and the heading 44.25 px. This verifies the app's sizing issue; it does not inspect the user's operating-system display settings.

Latest visual evidence:

- `.artifacts/device-stage/compact-final.png`: final dark workspace, 1196 × 964; all five router names fit, NAS selected.
- `.artifacts/device-stage/compact-1920.png` and `compact-4k.png`: 1920 × 1080 and 3840 × 2160 logical viewport checks. Sidebar, heading, hero, dock targets, and primary button measured identically at both sizes; document dimensions matched each viewport.
- `.artifacts/device-stage/blue-router.png`: blue router theme and empty-device state. Teal, rose, and amber mapping verified through UI switching and computed background filters; amber light mode visually inspected.
- `.artifacts/device-stage/compact-390.png`: narrow 390 × 844 workspace; document width 390, selected dock device fully visible, service and primary actions available.

Interaction checks: cross-router search for NAS opened its device; fresh navigation to `/` restored NAS directly without overview; settings opened and returned to the same device. Settings source and styles are unchanged. Existing workspace-state tests passed (6/6); lint, formatting, and production build passed. The build retains the pre-existing large vendor-chunk advisory. Native Tauri window behavior and actual monitor scaling were not tested.

## Initial concept implementation (historical)

- Target: selected option 1, `/Users/diaozhenyuan/.codex/generated_images/01a07d21-8efe-7bd3-88e3-08a38f2bfcff/exec-0a319784-357d-4e09-bb10-2ed257437c77.png`.
- Implementation: `.artifacts/device-stage/desktop-final.png`, captured in the Codex in-app browser at `/routers/766e50f3-ac18-4df0-ad02-c3e99b8f425f` with NAS selected and dark theme.
- Source and final implementation: 1487 × 1058 pixels. Browser viewport: 1487 × 1058 CSS pixels, devicePixelRatio 1. No density scaling.
- Full-view evidence: source and final screenshot were opened together in the same comparison call. At full resolution, title, address, service launch, management button, sidebar, and dock were all readable; a separate region crop was not needed.

## Comparison history

1. Initial rendering: search input inherited the old opaque background and inadequate left padding, overlapping the icon (P2). Fixed with stage-specific token classes on the existing Input component.
2. First matched capture (`desktop-matched.png`): primary button too small; hero and text too far left/up; sidebar illustrations too small (P2). Increased primary action to 244 × 58 px, adjusted presentation inset and vertical spacing, enlarged sidebar illustrations and dock targets.
3. Responsive check: collapsed sidebar hid accessible button names; viewport changes could leave the current dock item partially outside the scroll area (P2). Added explicit labels and a ResizeObserver to reveal the selected device after width changes.
4. Final recapture (`desktop-final.png`): no outstanding P0/P1/P2 findings. Rejected a transient cropped capture immediately following viewport change, then recaptured after confirming viewport and rendered state.

## Fidelity and product constraints

- Typography: clear device heading, subordinate address, readable service and primary action labels. Long device names wrap in the detail region and truncate with titles in compact navigation.
- Layout: continuous translucent sidebar, large isolated NAS, right-side services and management action, bottom device dock. No statistics, extra filters, or marketing copy added.
- Color: dedicated light/dark `--stage-*` tokens and generated violet background. Existing settings colors and components are unchanged.
- Images: independent transparent NAS asset and 1487 × 1058 background generated with the built-in image tool using option 1. Original device assets retained for settings and other device categories.
- Content: real inventory has five routers and seven devices, rather than the three illustrative entries in the mock. Preserve names, ordering, and services; scroll overflow instead of inserting fictional inventory. Service icon uses the existing application's actual icon rather than the invented S icon in the mock.
- Native window buttons are left to Tauri/macOS; the browser preview does not draw fake window controls. Existing window-drag helper remains connected.
- P3: generated NAS silhouette and lighting vary slightly from the concept; original hardware illustration types remain for laptops and single-board computers.

## Interaction and responsive checks

- Search NAS and enter the matching router/device; keyboard result navigation supported.
- Device dock Home/End selection, focus, and selected-state feedback verified.
- Copy device address: success notification verified.
- Notes: opened read-only note viewer, confirmed empty content state, closed successfully.
- Router switching: verified empty router and return-to-settings action.
- Settings: existing page opened, then returned to browsing; settings files were not edited.
- Dark 390 × 844 and light 1024 × 768 captures saved as `narrow-390.png` and `light-1024.png`; document width matched viewport and primary content/actions remained available.
- Reduced-motion handling disables floating, pointer tilt and CSS transitions and uses zero-duration page changes. Offscreen app pauses the floating animation.
- Browser console: no error or warning entries during checks.
- External service click exercised using existing openExternal helper; destination app behavior and native Tauri window actions were not validated in the in-app browser. No external service or inventory data was modified.

## Asset provenance

- `apps/desktop/public/devices/stage-nas.png`: built-in imagegen. Prompt: four-bay graphite NAS matching selected reference, purple rim light, transparent background, no text/UI. Final edit preserved the NAS and removed the checkerboard to actual RGBA alpha. 1402 × 1122.
- `apps/desktop/public/images/violet-stage.webp`: built-in imagegen. Prompt: selected reference's continuous violet velvet atmosphere, broad upper-left orchid glow, deep blue-violet lower/right, no objects, UI, text, lines or stars. Format-only WebP conversion, quality 95; 1487 × 1058, 37,400 bytes.
