# Workspace Conventions

This directory is generated from `one.manifest.json` by One CLI.

- Keep project identity, paths, templates, and domain selections in `one.manifest.json`.
- Add projects with `one add <template-id> --name <name>` so the manifest, infrastructure files, and agent docs stay in sync.
- Use the root `AGENTS.md` route table first, then open the matching project or ops guide on demand.
- Do not put credentials, tokens, private keys, or `.env*` values in agent-facing docs.
- If generated docs look stale, rerun the One CLI workflow that changes the manifest; do not invent a manual agent-doc refresh command.
