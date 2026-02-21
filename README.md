# ScienceLift

ScienceLift is a science-based lifting planner with diet targets, routine generation, settings, and mobile/PWA support.

## Quick Start (Local)

1. Install dependencies:
```bash
npm install
```
2. Run a local server from this folder (example with VS Code Live Server or any static server).
3. Open `index.html` in the browser served by that local server.

## GitHub Upload Checklist

- App entry files are in repo root: `index.html`, `style.css`, `script.js`.
- PWA files are included: `manifest.json`, `sw.js`, `icons/`.
- Large build artifacts (`.apk`, `.aab`) are ignored by default.
- Auto deploy workflow is included at `.github/workflows/pages.yml`.

## Deploy to GitHub Pages

1. Create a GitHub repo and push this project.
2. In GitHub, go to:
`Settings -> Pages -> Build and deployment -> Source: GitHub Actions`
3. The included workflow will deploy on push to `master` or `main`.

After deploy, your site URL will be:
`https://<your-username>.github.io/<repo-name>/`

## Mobile Builds (Capacitor)

See `BUILD_MOBILE.md` for Android/iOS build steps.
