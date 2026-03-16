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

var TERRAIN_EXAGGERATION_STEPS = [1, 1.5, 2];

function syncLightingButton() {
  var btn = document.getElementById("lighting-btn");
  if (!btn) return;
  btn.classList.toggle("active", !!S.nightMode);
  btn.setAttribute("aria-pressed", S.nightMode ? "true" : "false");
  btn.textContent = S.nightMode ? "NATT" : "DAG";
  btn.title = S.nightMode ? "Bytt til dagvisning" : "Bytt til nattvisning";
}

function syncTerrainButton() {
  var btn = document.getElementById("terrain-btn");
  var value =
    typeof S.terrainExaggeration === "number" ? S.terrainExaggeration : 1;
  if (!btn) return;
  btn.classList.toggle("active", value > 1);
  btn.textContent = "TER " + String(value).replace(".0", "") + "X";
  btn.title = "Bytt terrengforsterkning (" + value + "x)";
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

function setTerrainExaggeration(value) {
  S.terrainExaggeration =
    typeof value === "number" && !isNaN(value) ? value : 1;
  syncTerrainButton();
  if (!S.viewer || !S.viewer.scene) return;

  S.viewer.scene.verticalExaggeration = S.terrainExaggeration;
  if ("verticalExaggerationRelativeHeight" in S.viewer.scene) {
    S.viewer.scene.verticalExaggerationRelativeHeight = 0;
  }
  if (typeof S.viewer.scene.requestRender === "function") {
    S.viewer.scene.requestRender();
  }
}

window.cycleTerrainExaggeration = function () {
  var current =
    typeof S.terrainExaggeration === "number" ? S.terrainExaggeration : 1;
  var index = TERRAIN_EXAGGERATION_STEPS.findIndex(function (step) {
    return Math.abs(step - current) < 0.001;
  });
  var nextIndex =
    index >= 0 ? (index + 1) % TERRAIN_EXAGGERATION_STEPS.length : 0;
  setTerrainExaggeration(TERRAIN_EXAGGERATION_STEPS[nextIndex]);
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
  setTerrainExaggeration(S.terrainExaggeration || 1);

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

syncTerrainButton();
