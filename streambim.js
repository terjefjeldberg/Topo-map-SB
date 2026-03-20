function _getNestedValue(obj, path) {
  var value = obj;
  for (var i = 0; i < path.length; i++) {
    if (!value || typeof value !== "object") return null;
    value = value[path[i]];
  }
  return value == null ? null : value;
}

function _normalizeVector3(raw) {
  if (!raw) return null;
  if (Array.isArray(raw) && raw.length >= 3) {
    return {
      easting: Number(raw[0]),
      alt: Number(raw[1]),
      northing: Number(raw[2]),
    };
  }
  if (typeof raw === "object") {
    var easting =
      raw.easting != null ? raw.easting : raw.x != null ? raw.x : raw.lon;
    var alt = raw.alt != null ? raw.alt : raw.y != null ? raw.y : raw.height;
    var northing =
      raw.northing != null ? raw.northing : raw.z != null ? raw.z : raw.lat;
    if (easting != null && alt != null && northing != null) {
      return {
        easting: Number(easting),
        alt: Number(alt),
        northing: Number(northing),
      };
    }
  }
  return null;
}

function _normalizeQuaternion(raw) {
  if (!raw) return null;
  if (Array.isArray(raw) && raw.length >= 4) {
    return { x: raw[0], y: raw[1], z: raw[2], w: raw[3] };
  }
  if (
    typeof raw === "object" &&
    raw.x != null &&
    raw.y != null &&
    raw.z != null &&
    raw.w != null
  ) {
    return { x: raw.x, y: raw.y, z: raw.z, w: raw.w };
  }
  return null;
}

function _extractCameraPayload(raw) {
  if (!raw || typeof raw !== "object") return null;

  var base =
    _getNestedValue(raw, ["camera"]) ||
    _getNestedValue(raw, ["cameraState"]) ||
    _getNestedValue(raw, ["viewport", "camera"]) ||
    raw;

  var position =
    _normalizeVector3(base.position) ||
    _normalizeVector3(base.target) ||
    _normalizeVector3(base.orbitCenter) ||
    _normalizeVector3(raw.position);
  var eye =
    _normalizeVector3(base.eye) ||
    _normalizeVector3(base.cameraPosition) ||
    _normalizeVector3(base.eyePosition) ||
    _normalizeVector3(raw.eye);
  var target =
    _normalizeVector3(base.target) ||
    _normalizeVector3(base.orbitCenter) ||
    _normalizeVector3(raw.target) ||
    position;
  var orientation =
    _normalizeQuaternion(base.orientation) ||
    _normalizeQuaternion(base.quaternion) ||
    _normalizeQuaternion(raw.orientation) ||
    _normalizeQuaternion(raw.quaternion);
  var range =
    Number(base.range) ||
    Number(base.distance) ||
    Number(base.zoomDistance) ||
    Number(base.cameraDistance) ||
    Number(raw.range) ||
    Number(raw.distance);

  if (!position && !eye && !target) return null;

  return {
    position: position || target || eye,
    target: target || position || eye,
    eye: eye || null,
    orientation: orientation,
    quaternion: orientation,
    range: isNaN(range) ? null : range,
  };
}

function _fetchBestCameraState() {
  if (!S || !S.api) return Promise.resolve(null);
  if (typeof S.api.getViewportState === "function") {
    return S.api
      .getViewportState()
      .then(function (viewport) {
        if (!window._viewportLogged) {
          window._viewportLogged = true;
          console.log("POLL VIEWPORT:", JSON.stringify(viewport));
        }
        var normalizedViewport = _extractCameraPayload(viewport);
        if (normalizedViewport) return normalizedViewport;
        return typeof S.api.getCameraState === "function"
          ? S.api.getCameraState()
          : null;
      })
      .then(function (cam) {
        return _extractCameraPayload(cam);
      });
  }
  if (typeof S.api.getCameraState === "function") {
    return S.api.getCameraState().then(function (cam) {
      return _extractCameraPayload(cam);
    });
  }
  return Promise.resolve(null);
}

// Polling must be defined before StreamBIM.connect fires
window._startPolling = function () {
  if (window._pollInterval) return;
  window._pollInterval = setInterval(
    function () {
      if (!S || !S.api) return;
      _fetchBestCameraState()
        .then(function (cam) {
          if (!cam) return;
          if (!window._pollLogged) {
            window._pollLogged = true;
            console.log("POLL CAM:", JSON.stringify(cam));
          }
          window._onCamera(cam);
        })
        .catch(function () {});
    },
    (window._sbConfig && window._sbConfig.pollIntervalMs) || 100,
  );
};

// ── StreamBIM connect — must happen synchronously on page load ──
window.StreamBIM.connect({
  cameraChanged: function (cam) {
    var el = document.getElementById("conn-status");
    if (el) {
      el.textContent = "● Connected";
      el.className = "connected";
    }
    window._startPolling();
    if (!cam) return;
    cam = _extractCameraPayload(cam);
    if (!cam) return;

    // Update coords display
    var coords = document.getElementById("coords");
    if (coords) coords.style.display = "block";
    var vl = document.getElementById("v-lat");
    var vn = document.getElementById("v-lon");
    var va = document.getElementById("v-alt");
    var displayPos = cam.eye || cam.target || cam.position;
    if (vl) vl.textContent = "E  " + displayPos.easting.toFixed(1);
    if (vn) vn.textContent = "N  " + displayPos.northing.toFixed(1);
    if (va) setHeightReadout(displayPos.alt);

    if (!S.ready) {
      S.pending.push({ type: "cam", d: cam });
      return;
    }
    window._onCamera(cam);
  },
  pickedObject: function (res) {
    if (!res || !res.point) return;
    if (!S.ready) {
      S.pending.push({ type: "pick", d: res });
      return;
    }
    window._onPick(res);
  },
})
  .then(function (api) {
    S.api = api || null;
    if (
      !S.api &&
      window.StreamBIM &&
      (typeof window.StreamBIM.getCameraState === "function" ||
        typeof window.StreamBIM.getViewportState === "function")
    ) {
      S.api = window.StreamBIM;
    }
    S.connected = true;
  })
  .catch(function (e) {
    var el = document.getElementById("conn-status");
    if (el) {
      el.textContent = "● Disconnected";
      el.style.color = "#f04040";
    }
  });

// All functions called from HTML inline handlers — must be in first script block
window.startWidget = function () {
  if (!getTmParams(_epsgSetupCode)) {
    warnUnsupportedCrs(_epsgSetupCode, _epsgSetupName);
    var selected = document.getElementById("epsg-setup-selected");
    if (selected)
      selected.textContent = "Ikke støttet ennå: EPSG:" + _epsgSetupCode;
    return;
  }
  S.epsg = "EPSG:" + _epsgSetupCode;
  document.getElementById("crs-current").textContent = "EPSG:" + _epsgSetupCode;
  document.getElementById("crs-current").title = _epsgSetupName;
  document.getElementById("setup-overlay").style.display = "none";
  document.getElementById("loading-screen").style.display = "flex";
  loadScripts();
};
