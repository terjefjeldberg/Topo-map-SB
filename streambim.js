// Polling must be defined before StreamBIM.connect fires
window._startPolling = function () {
  if (window._pollInterval) return;
  window._pollInterval = setInterval(
    function () {
      if (!S || !S.api) return;
      S.api
        .getCameraState()
        .then(function (cam) {
          if (!cam) return;
          if (!window._pollLogged) {
            window._pollLogged = true;
            console.log("POLL CAM:", JSON.stringify(cam));
          }
          if (Array.isArray(cam.position)) {
            cam.position = {
              easting: cam.position[0],
              alt: cam.position[1],
              northing: cam.position[2],
            };
          }
          if (cam.quaternion && Array.isArray(cam.quaternion)) {
            cam.orientation = {
              x: cam.quaternion[0],
              y: cam.quaternion[1],
              z: cam.quaternion[2],
              w: cam.quaternion[3],
            };
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
    var pos = Array.isArray(cam.position)
      ? cam.position
      : [cam.position.x, cam.position.y, cam.position.z];
    cam.position = { easting: pos[0], alt: pos[1], northing: pos[2] };
    var quat = cam.quaternion || cam.orientation;
    if (quat && Array.isArray(quat))
      cam.orientation = { x: quat[0], y: quat[1], z: quat[2], w: quat[3] };

    // Update coords display
    var coords = document.getElementById("coords");
    if (coords) coords.style.display = "block";
    var vl = document.getElementById("v-lat");
    var vn = document.getElementById("v-lon");
    var va = document.getElementById("v-alt");
    if (vl) vl.textContent = "E  " + cam.position.easting.toFixed(1);
    if (vn) vn.textContent = "N  " + cam.position.northing.toFixed(1);
    if (va) setHeightReadout(cam.position.alt);

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
      typeof window.StreamBIM.getCameraState === "function"
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
