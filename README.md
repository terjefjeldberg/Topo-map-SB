# Topo-map-SB

StreamBIM widget that mirrors camera movement into a Cesium terrain view with optional 3D buildings, measurement tools, CRS selection, and building info.

## Project Structure

- `index.html`: Widget shell and UI markup.
- `styles.css`: Styling for topbar, overlays, panels, and controls.
- `config.js`: Central runtime config (defaults, poll interval, Cesium token).
- `state.js`: Shared state and CRS/projection definitions.
- `streambim.js`: StreamBIM connection and camera polling bridge.
- `epsg.js`: EPSG search/setup UI logic.
- `viewer.js`: Cesium setup, camera sync, basemap/night mode, buildings.
- `measure.js`: Distance and area measuring tools.
- `hierarchy-widget/`: Starter for IFC hierarchy tree widget (lazy-load + fallback).
- `.github/workflows/deploy-pages.yml`: GitHub Pages deployment workflow.

## Local Run

This widget is static and can be run with any local web server.

PowerShell example:

```powershell
python -m http.server 8080
```

Then open `http://localhost:8080/`.

## Configuration

All key defaults are in `config.js`:

- `defaultEpsg`
- `defaultEpsgCode`
- `defaultEpsgName`
- `pollIntervalMs`
- `defaultBaseMapMode`
- `defaultNightMode`
- `cesiumIonToken`

Recommended: keep all environment-specific values there and avoid hardcoding in other files.

## Deploy

Deployment is handled by GitHub Actions in `.github/workflows/deploy-pages.yml`.

Typical flow:

1. Commit changes to `main`.
2. Push to GitHub.
3. Workflow deploys to GitHub Pages.

## Quick Verification

Use `SMOKE_TEST.md` after each deployment.
