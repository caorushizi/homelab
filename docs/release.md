# Homelab Release Workflow

`.github/workflows/release.yml` is a manually triggered release pipeline with two build tracks:

1. Desktop installers for macOS, Linux, and Windows.
2. A multi-architecture server image published to GitHub Container Registry.

## Required GitHub configuration

In **Settings → Secrets and variables → Actions**, create these repository secrets:

| Secret | Value |
| --- | --- |
| `APPLE_TEAM_ID` | Apple Developer Team ID |
| `APPLE_ID` | Apple ID email used for notarization |
| `APPLE_PASSWORD` | Apple app-specific password, not the normal Apple ID password |
| `APPLE_CERTIFICATE` | Base64-encoded Developer ID Application `.p12` certificate |
| `APPLE_CERTIFICATE_PASSWORD` | Password used when exporting the `.p12` certificate |

The workflow creates a random temporary keychain password, so no persistent `KEYCHAIN_PASSWORD` secret is required.

The certificate must contain its private key and should be a **Developer ID Application** certificate when distributing the DMG outside the Mac App Store.

In **Settings → Actions → General**, allow GitHub Actions to use read and write repository permissions. The branch selected when manually running the workflow must also allow `github-actions[bot]` to push the generated release commit.

Do not add Apple credentials to `.env`, YAML files, commits, issues, or chat messages.

## Triggering a release

1. Open the repository's **Actions** tab.
2. Select **Release**.
3. Click **Run workflow** on the branch to release.
4. Select `patch`, `minor`, or `major`.

The workflow reads the newest stable tag matching `vMAJOR.MINOR.PATCH`. If no release tag exists, it starts from the desktop application's current version.

Examples from `v1.4.2`:

| Input | Next version |
| --- | --- |
| `patch` | `v1.4.3` |
| `minor` | `v1.5.0` |
| `major` | `v2.0.0` |

The workflow updates all tracked version files, creates a release commit, pushes the new Git tag, and opens a draft GitHub Release.

## Desktop output

The desktop matrix produces:

- A universal macOS package for Apple Silicon and Intel.
- Linux x64 bundles.
- Windows x64 bundles.

The macOS job imports the certificate into an ephemeral keychain, signs the application, authenticates to Apple using the app-specific password, notarizes the package, and removes the temporary keychain.

## Server image output

The service image is built for:

- `linux/amd64`
- `linux/arm64`

It is published to:

```text
ghcr.io/OWNER/REPOSITORY:VERSION
ghcr.io/OWNER/REPOSITORY:vVERSION
ghcr.io/OWNER/REPOSITORY:latest
```

The workflow uses the built-in `GITHUB_TOKEN`; no separate registry password is required. The token receives `packages: write` only in the server image job.

The draft GitHub Release is published only after every desktop build and the server image push succeed.
