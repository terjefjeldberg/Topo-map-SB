# Smoke Test Checklist

Run this checklist after local changes and after GitHub Pages deploy.

## Startup

- [ ] Widget loads without console errors.
- [ ] Setup overlay appears and allows EPSG selection.
- [ ] `OPEN MAP` starts Cesium and hides loading screen.

## StreamBIM Sync

- [ ] Connection indicator switches to connected.
- [ ] Camera position in StreamBIM updates Cesium camera in near real time.
- [ ] Coordinate readout (`E`, `N`, `H`) updates continuously.

## Basemap and Lighting

- [ ] `FOTO/KART` toggle switches imagery correctly.
- [ ] `DAG/NATT` button label matches current mode.
- [ ] Night mode changes scene lighting as expected.

## Measurement

- [ ] Distance tool draws in `#F2921C` and shows readable labels.
- [ ] Area tool fill/stroke uses `#F2921C`.
- [ ] Area result label appears in polygon center and is clearly readable.
- [ ] Tool result text has dark transparent background for readability.

## 3D Buildings

- [ ] Buildings load in a dense area (e.g. Oslo sentrum).
- [ ] Hover highlight works.
- [ ] Click selects building and opens info panel.
- [ ] Close button clears selection and hides panel.

## CRS / UX

- [ ] Topbar CRS value updates when selecting another EPSG.
- [ ] CRS search dropdown returns expected matches.
- [ ] Compass, CRS label, and coordinate accent color is `#F2921C`.

## Regression Spot Check

- [ ] No duplicate event handlers after repeated tool toggles.
- [ ] No major FPS drop while moving camera.
- [ ] No breaking errors in browser console during a 2-3 minute session.
