# homelab Agent Guide

Scope: this file is the canonical agent entry point for this One workspace.

Always-on rules:
- Treat `one.manifest.json` as the source of truth for projects and domains.
- Use `one add` to add projects and let the CLI refresh generated agent docs.
- Read the route below, then open only the detail files relevant to the task.
- Do not hand-edit content between One CLI managed markers.

## On-demand Routes

<!-- one agents:index:start -->
Use this index to choose the smallest relevant detail file.

- Workspace conventions: [`.one/agents/conventions.md`](.one/agents/conventions.md)

### Projects

- `apps/desktop (react-spa)`: [`.one/agents/projects/apps-desktop.md`](.one/agents/projects/apps-desktop.md)
- `services/api (go-api)`: [`.one/agents/projects/services-api.md`](.one/agents/projects/services-api.md)

### Operations

- Dev workflows: [`.one/agents/ops/dev.md`](.one/agents/ops/dev.md)
- Environment variables: [`.one/agents/ops/secrets.md`](.one/agents/ops/secrets.md)
<!-- one agents:index:end -->

## Sub-projects

<!-- one subprojects:start -->
| Project | Template | Guide |
|---------|----------|-------|
| `apps/desktop` | `react-spa` | [`.one/agents/projects/apps-desktop.md`](.one/agents/projects/apps-desktop.md) |
| `services/api` | `go-api` | [`.one/agents/projects/services-api.md`](.one/agents/projects/services-api.md) |
<!-- one subprojects:end -->
