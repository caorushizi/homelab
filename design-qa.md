# Homelab Design QA

- Source visual truth: `docs/design/labmap-dark-reference.png`
- Source pixels: 1485 × 1059 RGB
- Intended implementation viewport: 1440 × 1024 CSS px at device scale factor 1
- Implementation URL: `http://127.0.0.1:5173/`
- Implementation screenshot: unavailable
- State: dark mode, main router selected, NAS selected, six NAS services visible
- Density normalization: not performed because browser capture was unavailable

**Findings**

- [P0] Browser-rendered implementation evidence is unavailable.
  Location: local Homelab preview.
  Evidence: the in-app browser refused the local URL because its admin-enforced security policy could not be verified. Both the original tab and a fresh retry tab failed before navigation, so no DOM snapshot, screenshot, console log, or interaction evidence could be captured.
  Impact: the source and implementation cannot be placed into the required same-input visual comparison. Typography, spacing, colors, image compositing, responsive behavior, and visible interaction states cannot be signed off.
  Fix: capture the running Tauri/Vite implementation at 1440 × 1024 and repeat the full-view and focused-region comparison against the source visual.

**Required Fidelity Surfaces**

- Fonts and typography: blocked pending implementation screenshot.
- Spacing and layout rhythm: blocked pending implementation screenshot.
- Colors and visual tokens: source palette is implemented through dark cobalt design tokens, but visible comparison is blocked.
- Image quality and asset fidelity: six generated device assets are present in the project, but browser compositing and edge quality are not verified.
- Copy and content: source copy is represented in the implementation; visual wrapping and truncation remain blocked.

**Full-view comparison evidence**

Blocked. The source image was opened and inspected, but no browser-rendered implementation image could be captured.

**Focused region comparison evidence**

Blocked. Router sidebar, topology center, machine summary, and service list could not be captured from the implementation.

**Primary interactions tested**

- API health and nested topology CRUD were exercised directly against a temporary SQLite database.
- Browser interaction tests for router selection, search, add-device dialog, add-service dialog, and console errors are blocked.

**Comparison history**

- Initial pass: blocked before visual comparison by the local-browser security policy check.
- Retry with a fresh in-app browser tab: blocked by the same policy check.

**Implementation Checklist**

- Obtain a 1440 × 1024 screenshot of the current main-router/NAS state.
- Compare it with `docs/design/labmap-dark-reference.png` in one visual input.
- Fix all P0/P1/P2 typography, spacing, color, image, or interaction mismatches.
- Repeat capture and comparison until no actionable P0/P1/P2 findings remain.

**Follow-up Polish**

- Evaluate the generated laptop and single-board-computer alpha edges against the dark background.
- Confirm service rows remain readable when service names and URLs are longer than the demo data.

final result: blocked
