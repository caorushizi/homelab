# Environment Operations

Use `one env` for workspace and project environment variables.

- `one env set` records declared keys without storing values in `one.manifest.json`.
- `one env get`, `one env list`, and `one env pull` read from the selected env backend.
- Do not commit `.env*` values, private keys, or provider tokens.
