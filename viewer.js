function loadScripts() {
  _log("Loading Cesium…");
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/cesium@1.136.0/Build/Cesium/Cesium.js";
  s.onload = function () {
    _log("Cesium ready", "ok");
    initCesium();
  };
  s.onerror = function () {
    _log("Cesium failed to load", "err");
  };
  document.head.appendChild(s);
}

async function enableBuildings(viewer) {
  if (!viewer || typeof Cesium.createOsmBuildingsAsync !== "function") {
    _log("3D buildings not supported in this Cesium build", "warn");
    return;
  }

  try {
    _log("Loading 3D buildings...");
    var tileset = await Cesium.createOsmBuildingsAsync({
      style: new Cesium.Cesium3DTileStyle({
        color: "color('#f4eee6', 0.92)",
      }),
    });
    tileset.shadows = S.nightMode
      ? Cesium.ShadowMode.DISABLED
      : Cesium.ShadowMode.ENABLED;
    viewer.scene.primitives.add(tileset);
    viewer.scene.globe.depthTestAgainstTerrain = true;
    S.buildingsTileset = tileset;
    _log("3D buildings enabled", "ok");
  } catch (err) {
    console.warn("Failed to load 3D buildings", err);
    _log("3D buildings unavailable here", "warn");
  }
}

var BUILDING_HOVER_COLOR = "#F2921C";
var BUILDING_SELECTED_COLOR = "#FFF4D6";
var BUILDING_INFO_FIELDS = [
  { keys: ["name", "name:en"], label: "Navn" },
  { keys: ["building"], label: "Type" },
  { keys: ["shop", "amenity", "office"], label: "Bruk" },
  { keys: ["cesium#estimatedHeight", "height"], label: "Hoyde" },
  { keys: ["building:levels"], label: "Etasjer" },
  { keys: ["addr:street"], label: "Gate" },
  { keys: ["addr:housenumber"], label: "Nummer" },
  { keys: ["addr:postcode"], label: "Postnr" },
  { keys: ["addr:city"], label: "By" },
  { keys: ["opening_hours"], label: "Aapningstider" },
  { keys: ["operator"], label: "Operator" },
  { keys: ["access"], label: "Adgang" },
  { keys: ["wheelchair"], label: "Tilgjengelighet" },
  { keys: ["source"], label: "Kilde" },
  { keys: ["elementType"], label: "OSM-type" },
  { keys: ["elementId"], label: "OSM-ID" },
];

function requestSceneRender() {
  if (
    S.viewer &&
    S.viewer.scene &&
    typeof S.viewer.scene.requestRender === "function"
  ) {
    S.viewer.scene.requestRender();
  }
}

function getBuildingInfoElements() {
  return {
    panel: document.getElementById("building-info"),
    title: document.getElementById("building-info-title"),
    body: document.getElementById("building-info-body"),
  };
}

function normalizeBuildingValue(value) {
  if (value == null) return null;
  if (Array.isArray(value)) value = value.join(", ");
  if (typeof value === "object") {
    try {
      value = JSON.stringify(value);
    } catch (_err) {
      return null;
    }
  }
  value = String(value).trim();
  return value ? value : null;
}

function getBuildingProperty(feature, keys) {
  if (!feature || typeof feature.getProperty !== "function") return null;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = normalizeBuildingValue(feature.getProperty(key));
    if (value) return { key: key, value: value };
  }
  return null;
}

function formatBuildingInfoValue(key, value) {
  if (key === "cesium#estimatedHeight" || key === "height") {
    var num = Number(value);
    if (!isNaN(num))
      return (num >= 100 ? Math.round(num) : num.toFixed(1)) + " m";
  }
  if (key === "wheelchair") {
    if (value === "yes") return "Ja";
    if (value === "no") return "Nei";
    if (value === "limited") return "Begrenset";
  }
  return value;
}

function createBuildingInfoRow(label, value) {
  var row = document.createElement("div");
  row.className = "building-info-row";

  var labelEl = document.createElement("div");
  labelEl.className = "building-info-label";
  labelEl.textContent = label;

  var valueEl = document.createElement("div");
  valueEl.className = "building-info-value";
  valueEl.textContent = value;

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return row;
}

function hideBuildingInfo() {
  var els = getBuildingInfoElements();
  if (!els.panel || !els.body || !els.title) return;
  els.panel.hidden = true;
  els.title.textContent = "BYGGINFO";
  els.body.innerHTML = "";
}

function showBuildingInfo(feature) {
  var els = getBuildingInfoElements();
  if (!els.panel || !els.body || !els.title) return;

  els.body.innerHTML = "";
  if (!feature) {
    hideBuildingInfo();
    return;
  }

  var titleProp = getBuildingProperty(feature, ["name", "name:en"]);
  var typeProp = getBuildingProperty(feature, ["building", "shop", "amenity"]);
  els.title.textContent = titleProp
    ? titleProp.value
    : typeProp
      ? "Bygg - " + typeProp.value
      : "BYGGINFO";

  var usedKeys = {};
  var rowCount = 0;

  BUILDING_INFO_FIELDS.forEach(function (field) {
    var prop = getBuildingProperty(feature, field.keys);
    if (!prop || usedKeys[prop.key]) return;
    usedKeys[prop.key] = true;
    els.body.appendChild(
      createBuildingInfoRow(
        field.label,
        formatBuildingInfoValue(prop.key, prop.value),
      ),
    );
    rowCount += 1;
  });

  if (!rowCount && typeof feature.getPropertyIds === "function") {
    var propertyIds = feature.getPropertyIds([]);
    propertyIds.slice(0, 8).forEach(function (propertyId) {
      if (usedKeys[propertyId]) return;
      var rawValue = normalizeBuildingValue(feature.getProperty(propertyId));
      if (!rawValue) return;
      usedKeys[propertyId] = true;
      els.body.appendChild(
        createBuildingInfoRow(
          propertyId,
          formatBuildingInfoValue(propertyId, rawValue),
        ),
      );
      rowCount += 1;
    });
  }

  if (!rowCount) {
    var empty = document.createElement("div");
    empty.className = "building-info-empty";
    empty.textContent =
      "Ingen tilgjengelig metadata for dette bygget fra Cesium OSM Buildings.";
    els.body.appendChild(empty);
  }

  els.panel.hidden = false;
}

function setBuildingFeatureColor(feature, colorCss, alpha) {
  if (!feature || typeof Cesium === "undefined") return;
  try {
    feature.color = Cesium.Color.fromCssColorString(colorCss).withAlpha(
      typeof alpha === "number" ? alpha : 1,
    );
  } catch (_err) {}
}

function resetBuildingFeatureColor(feature) {
  if (!feature || typeof Cesium === "undefined") return;
  try {
    feature.color = Cesium.Color.WHITE;
  } catch (_err) {}
}

function isBuildingFeature(picked) {
  if (!picked || typeof Cesium === "undefined" || !S.buildingsTileset)
    return false;

  var isTileFeature =
    (typeof Cesium.Cesium3DTileFeature !== "undefined" &&
      picked instanceof Cesium.Cesium3DTileFeature) ||
    (typeof Cesium.ModelFeature !== "undefined" &&
      picked instanceof Cesium.ModelFeature);

  if (!isTileFeature) return false;

  return (
    picked.primitive === S.buildingsTileset ||
    picked.tileset === S.buildingsTileset ||
    (picked.content && picked.content.tileset === S.buildingsTileset)
  );
}

function clearHoveredBuilding() {
  if (!S.hoveredBuildingFeature) return;
  if (S.hoveredBuildingFeature !== S.selectedBuildingFeature) {
    resetBuildingFeatureColor(S.hoveredBuildingFeature);
  }
  S.hoveredBuildingFeature = null;
}

function clearSelectedBuilding() {
  if (!S.selectedBuildingFeature) return;
  if (S.selectedBuildingFeature === S.hoveredBuildingFeature) {
    setBuildingFeatureColor(
      S.selectedBuildingFeature,
      BUILDING_HOVER_COLOR,
      0.95,
    );
  } else {
    resetBuildingFeatureColor(S.selectedBuildingFeature);
  }
  S.selectedBuildingFeature = null;
  hideBuildingInfo();
}

function setHoveredBuilding(feature) {
  if (S.hoveredBuildingFeature === feature) return;
  clearHoveredBuilding();
  S.hoveredBuildingFeature = feature || null;
  if (feature && feature !== S.selectedBuildingFeature) {
    setBuildingFeatureColor(feature, BUILDING_HOVER_COLOR, 0.95);
  }
  if (S.viewer && S.viewer.container) {
    S.viewer.container.style.cursor = feature ? "pointer" : "";
  }
  requestSceneRender();
}

function setSelectedBuilding(feature) {
  if (S.selectedBuildingFeature === feature) return;
  clearSelectedBuilding();
  S.selectedBuildingFeature = feature || null;
  if (feature) {
    setBuildingFeatureColor(feature, BUILDING_SELECTED_COLOR, 0.98);
    showBuildingInfo(feature);
  } else {
    hideBuildingInfo();
  }
  requestSceneRender();
}

window.clearBuildingSelection = function () {
  clearSelectedBuilding();
  requestSceneRender();
};

function initBuildingInteraction(viewer) {
  if (!viewer || typeof Cesium === "undefined") return;
  if (S.buildingHoverHandler) {
    S.buildingHoverHandler.destroy();
    S.buildingHoverHandler = null;
  }

  var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  handler.setInputAction(function (movement) {
    if (
      (typeof _measureActive !== "undefined" && _measureActive) ||
      (typeof _areaActive !== "undefined" && _areaActive)
    ) {
      setHoveredBuilding(null);
      return;
    }
    var picked = viewer.scene.pick(movement.endPosition);
    setHoveredBuilding(isBuildingFeature(picked) ? picked : null);
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  handler.setInputAction(function (click) {
    if (
      (typeof _measureActive !== "undefined" && _measureActive) ||
      (typeof _areaActive !== "undefined" && _areaActive)
    )
      return;
    var picked = viewer.scene.pick(click.position);
    var feature = isBuildingFeature(picked) ? picked : null;
    if (!feature) {
      clearSelectedBuilding();
      requestSceneRender();
      return;
    }
    if (feature === S.selectedBuildingFeature) {
      clearSelectedBuilding();
      requestSceneRender();
      return;
    }
    setSelectedBuilding(feature);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  S.buildingHoverHandler = handler;
}

function syncBaseMapButton() {
  var btn = document.getElementById("basemap-btn");
  var mode = S.baseMapMode === "kart" ? "kart" : "foto";
  if (!btn) return;
  btn.classList.toggle("active", mode === "foto");
  btn.setAttribute("aria-pressed", mode === "foto" ? "true" : "false");
  btn.textContent = mode === "foto" ? "FOTO" : "KART";
  btn.title = mode === "foto" ? "Bytt til kart" : "Bytt til ortofoto";
}

function syncLightingButton() {
  var btn = document.getElementById("lighting-btn");
  if (!btn) return;
  btn.classList.toggle("active", !!S.nightMode);
  btn.setAttribute("aria-pressed", S.nightMode ? "true" : "false");
  btn.textContent = S.nightMode ? "NATT" : "DAG";
  btn.title = S.nightMode ? "Bytt til dagvisning" : "Bytt til nattvisning";
}

function getLightingReferenceLongitude() {
  if (S.lastPos && typeof S.lastPos[0] === "number" && !isNaN(S.lastPos[0]))
    return S.lastPos[0];
  return 10.75;
}

function getModeTime(localHour) {
  var refLon = getLightingReferenceLongitude();
  var utcHour = localHour - refLon / 15;
  return new Date(
    Date.UTC(2024, 2, 20, 0, 0, 0) + Math.round(utcHour * 60 * 60 * 1000),
  );
}

function setLightingEnabled(enabled) {
  S.nightMode = enabled === true;
  syncLightingButton();
  if (!S.viewer || typeof Cesium === "undefined") return;

  var viewer = S.viewer;
  var isNight = !!S.nightMode;
  viewer.clock.shouldAnimate = false;
  viewer.clock.multiplier = 0;
  viewer.clock.currentTime = Cesium.JulianDate.fromDate(
    getModeTime(isNight ? 1 : 13),
  );
  viewer.shadows = !isNight;
  viewer.terrainShadows = isNight
    ? Cesium.ShadowMode.DISABLED
    : Cesium.ShadowMode.ENABLED;
  viewer.scene.globe.enableLighting = true;

  if (viewer.shadowMap) {
    viewer.shadowMap.enabled = !isNight;
    if ("softShadows" in viewer.shadowMap) viewer.shadowMap.softShadows = true;
    if ("darkness" in viewer.shadowMap) viewer.shadowMap.darkness = 0.4;
    if ("maximumDistance" in viewer.shadowMap)
      viewer.shadowMap.maximumDistance = 8000;
    if ("size" in viewer.shadowMap) viewer.shadowMap.size = 2048;
  }

  if (S.buildingsTileset) {
    S.buildingsTileset.shadows = isNight
      ? Cesium.ShadowMode.DISABLED
      : Cesium.ShadowMode.ENABLED;
  }

  if (viewer.scene && typeof viewer.scene.requestRender === "function") {
    viewer.scene.requestRender();
  }
}

window.toggleLighting = function () {
  setLightingEnabled(!S.nightMode);
};

async function getBaseMapProvider(mode) {
  if (!S.baseMapProviders) S.baseMapProviders = {};
  if (S.baseMapProviders[mode]) return S.baseMapProviders[mode];

  var url =
    mode === "kart"
      ? "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
      : "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";

  var provider = Cesium.ArcGisMapServerImageryProvider.fromUrl
    ? await Cesium.ArcGisMapServerImageryProvider.fromUrl(url)
    : new Cesium.ArcGisMapServerImageryProvider({ url: url });

  S.baseMapProviders[mode] = provider;
  return provider;
}

async function setBaseMapMode(mode) {
  var nextMode = mode === "kart" ? "kart" : "foto";
  S.baseMapMode = nextMode;
  syncBaseMapButton();
  if (!S.viewer || typeof Cesium === "undefined") return;

  try {
    var provider = await getBaseMapProvider(nextMode);
    var layers = S.viewer.imageryLayers;
    if (S.baseMapLayer) {
      layers.remove(S.baseMapLayer, false);
      S.baseMapLayer = null;
    } else {
      while (layers.length > 0) layers.remove(layers.get(0), false);
    }
    S.baseMapLayer = layers.addImageryProvider(provider, 0);
    if (S.viewer.scene && typeof S.viewer.scene.requestRender === "function") {
      S.viewer.scene.requestRender();
    }
  } catch (err) {
    console.warn("Failed to switch basemap", err);
    _log("Basemap unavailable", "warn");
  }
}

window.toggleBaseMap = function () {
  setBaseMapMode(S.baseMapMode === "foto" ? "kart" : "foto");
};

async function initCesium() {
  _log("Initialising globe…");
  Cesium.Ion.defaultAccessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlOGNmZDViOS0wZWYwLTQ1ZjktODkwZS0wNGJiODM4YTdjM2EiLCJpZCI6NDAyNDEwLCJpYXQiOjE3NzMzMDk4OTd9.yqBK0ZLNU-S9J2K-0xxMWc34Kzdlb0oCxgNOY4ADGDs";

  var viewer = new Cesium.Viewer("cesiumViewport", {
    terrainProvider: Cesium.CesiumTerrainProvider.fromIonAssetId
      ? await Cesium.CesiumTerrainProvider.fromIonAssetId(1)
      : Cesium.createWorldTerrain(),
    baseLayerPicker: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    geocoder: false,
    homeButton: false,
    fullscreenButton: false,
    animation: false,
    timeline: false,
    infoBox: false,
    selectionIndicator: false,
    creditContainer: document.createElement("div"),
  });

  S.viewer = viewer;
  setLightingEnabled(!!S.nightMode);
  S.baseMapMode = S.baseMapMode || "foto";
  syncBaseMapButton();
  setBaseMapMode(S.baseMapMode);

  // Red box marker for camera position
  S.marker = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(0, 0, 0),
    show: false,
    box: {
      dimensions: new Cesium.Cartesian3(20, 20, 20),
      material: Cesium.Color.RED.withAlpha(0.85),
    },
  });

  enableBuildings(viewer);
  initBuildingInteraction(viewer);

  _log("Globe ready", "ok");
  document.getElementById("loading-screen").style.display = "none";
  // Init measure click handler
  setTimeout(function () {
    if (!_measureInited) {
      _measureInited = true;
      initMeasureHandler();
      initAreaHandler();
    }
  }, 500);

  // Define camera handlers
  // _startPolling defined globally above

  window.setNavMode = function (mode) {
    if (!S.api) return;
    S.api.setNavigationMode(mode);
    document.querySelectorAll("[data-nav-mode]").forEach(function (b) {
      b.style.color = "#666";
      b.style.borderColor = "#333";
    });
    document.querySelectorAll("[data-nav-mode]").forEach(function (b) {
      if (String(b.getAttribute("data-nav-mode")) === String(mode)) {
        b.style.color = "#F2921C";
        b.style.borderColor = "#F2921C";
      }
    });
  };

  window._onCamera = function (cam) {
    var w = toWgs84(cam.position.easting, cam.position.northing);
    if (!w) return;
    var alt = cam.position.alt;
    var quat = cam.orientation || cam.quaternion;
    if (Array.isArray(quat))
      quat = { x: quat[0], y: quat[1], z: quat[2], w: quat[3] };

    // Compute heading from movement direction when position changes
    var computedHeading = null;
    if (S.lastPos) {
      var dE = cam.position.easting - S.lastPos[2];
      var dN = cam.position.northing - S.lastPos[3];
      var dist = Math.sqrt(dE * dE + dN * dN);
      if (dist > 0.5) {
        // When orbiting, camera points TOWARD orbit center = opposite of travel direction
        // So heading = travel direction + 180 degrees
        computedHeading = Math.atan2(dE, dN) + Math.PI;
      }
    }
    S.lastCamPos = cam;
    flyTo(w.lon, w.lat, alt, quat, computedHeading);
    S.lastPos = [w.lon, w.lat, cam.position.easting, cam.position.northing];

    document.getElementById("v-lat").textContent =
      "E  " + cam.position.easting.toFixed(1);
    document.getElementById("v-lon").textContent =
      "N  " + cam.position.northing.toFixed(1);
    setHeightReadout(cam.position.alt);
  };

  window._onPick = function (res) {
    var w = toWgs84(res.point[0], res.point[2]);
    if (w) flyTo(w.lon, w.lat, res.point[1], null);
  };

  // Flush pending events
  S.ready = true;
  S.pending.forEach(function (e) {
    if (e.type === "cam") window._onCamera(e.d);
    else if (e.type === "pick") window._onPick(e.d);
  });
  S.pending = [];
}

// Throttle: max 60fps
var _lastUpdate = 0;

function flyTo(lon, lat, alt, quat, computedHeading) {
  if (!S.viewer) return;
  if (isNaN(lon) || isNaN(lat)) return;

  // Throttle to ~60fps
  var now = Date.now();
  if (now - _lastUpdate < 16) return;
  _lastUpdate = now;

  var viewAlt = Math.max(50 + Math.abs(alt || 0), 5);
  var dest = Cesium.Cartesian3.fromDegrees(lon, lat, viewAlt);

  // Convert BCF quaternion to Cesium HPR
  // BCF: X=East, Y=North, Z=Up (right-handed)
  // Symptoms: CCW rotation -> globe tilts down = heading and pitch are swapped
  //           camera tilt up -> globe rotates CCW = pitch and heading swapped
  // Fix: swap heading/pitch axes
  var heading = 0,
    pitch = Cesium.Math.toRadians(-20),
    roll = 0;
  if (quat) {
    var qx = quat.x,
      qy = quat.y,
      qz = quat.z,
      qw = quat.w;
    // BCF quaternion: X=East, Y=North, Z=Up
    // Log raw quat on first call so we can see default orientation
    if (!window._quatLogged) {
      window._quatLogged = true;
      console.log("BCF quat:", JSON.stringify({ x: qx, y: qy, z: qz, w: qw }));
    }
    // Same method as byggstyrning: Euler YXZ from quaternion
    var len = Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw);
    qx /= len;
    qy /= len;
    qz /= len;
    qw /= len;

    // Three.js setFromQuaternion(q, 'YXZ') equivalent
    var m13 = 2 * (qx * qz + qw * qy);
    var m23 = 2 * (qy * qz - qw * qx);
    var m33 = 1 - 2 * (qx * qx + qy * qy);
    var m11 = 1 - 2 * (qy * qy + qz * qz);
    var m21 = 2 * (qx * qy + qw * qz);
    var m22 = 1 - 2 * (qx * qx + qz * qz);

    var ex = Math.asin(-Math.max(-1, Math.min(1, m23)));
    var ey, ez;
    if (Math.abs(m23) < 0.9999999) {
      ey = Math.atan2(m13, m33);
      ez = Math.atan2(m21, m22);
    } else {
      ey = Math.atan2(-m13, m11);
      ez = 0;
    }

    heading = ey + Math.PI;
    pitch = -ex;
    roll = 0;
  } else if (typeof computedHeading === "number" && !isNaN(computedHeading)) {
    heading = computedHeading;
  }

  // Use setView for instant, no animation — real-time tracking
  S.viewer.camera.setView({
    destination: dest,
    orientation: { heading: heading, pitch: pitch, roll: roll },
  });

  S.lastPos = [lon, lat];

  // Update compass
  var needle = document.getElementById("compass-needle");
  var hdgEl = document.getElementById("compass-hdg");
  if (needle) {
    var deg = Cesium.Math.toDegrees(heading) % 360;
    if (deg < 0) deg += 360;
    needle.setAttribute("transform", "rotate(" + deg + ",30,30)");
    if (hdgEl)
      hdgEl.textContent = String(Math.round(deg)).padStart(3, "0") + "°";
  }
}
