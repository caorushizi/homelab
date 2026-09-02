# Dev Operations

Use `one dev` from the workspace root to start manifest-backed development processes.

- Project dev commands live at `projects[].domains.dev.command`.
- A missing dev command means the project is not part of the dev supervisor.
- For one-off commands with project environment injection, use `one run` from the workspace root or a project directory.
