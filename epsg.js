window.searchEpsgSetup = function (val) {
  var dd = document.getElementById("epsg-setup-results");
  if (!val || val.length < 1) {
    dd.innerHTML = "";
    return;
  }
  var results = epsgSearch(val);
  if (!results.length) {
    dd.innerHTML =
      '<div style="padding:6px 10px;font-family:DM Mono,monospace;font-size:11px;color:#555">Ingen treff</div>';
    return;
  }
  dd.innerHTML = results
    .map(function (r) {
      return (
        '<div class="epsg-setup-item" data-code="' +
        r.code +
        '" data-name="' +
        r.name.replace(/"/g, "&quot;") +
        '" onclick="selectEpsgSetup(this.dataset.code,this.dataset.name)">' +
        '<span class="epsg-code">' +
        r.code +
        "</span>" +
        '<span class="epsg-name">' +
        r.name +
        "</span></div>"
      );
    })
    .join("");
};

window.selectEpsgSetup = function (code, name) {
  if (!getTmParams(code)) {
    var selected = document.getElementById("epsg-setup-selected");
    if (selected)
      selected.textContent = "Ikke støttet ennå: EPSG:" + code + " — " + name;
    warnUnsupportedCrs(code, name);
    return;
  }
  _epsgSetupCode = code;
  _epsgSetupName = name;
  document.getElementById("epsg-setup-results").innerHTML = "";
  document.getElementById("epsg-search-setup").value = "";
  var el = document.getElementById("epsg-setup-selected");
  if (el) el.textContent = "✓ " + code + " — " + name;
};

window.searchEpsg = function (val) {
  var dd = document.getElementById("epsg-dropdown");
  if (!val || val.length < 1) {
    dd.innerHTML = "";
    dd.classList.remove("open");
    return;
  }
  var results = epsgSearch(val);
  if (!results.length) {
    dd.innerHTML =
      '<div style="padding:6px 10px;font-family:DM Mono,monospace;font-size:11px;color:#555">Ingen treff</div>';
    dd.classList.add("open");
    return;
  }
  dd.innerHTML = results
    .map(function (r) {
      return (
        '<div class="epsg-item" data-code="' +
        r.code +
        '" data-name="' +
        r.name.replace(/"/g, "&quot;") +
        '" onclick="selectEpsgTopbar(this.dataset.code,this.dataset.name)">' +
        '<span class="epsg-code">' +
        r.code +
        "</span>" +
        '<span class="epsg-name">' +
        r.name +
        "</span></div>"
      );
    })
    .join("");
  dd.classList.add("open");
};

window.selectEpsgTopbar = function (code, name) {
  if (!getTmParams(code)) {
    warnUnsupportedCrs(code, name);
    return;
  }
  S.epsg = "EPSG:" + code;
  document.getElementById("crs-search").value = "";
  document.getElementById("crs-current").textContent = "EPSG:" + code;
  document.getElementById("crs-current").title = name;
  window.hideEpsgDropdown();
  if (S.lastCamPos) window._onCamera(S.lastCamPos);
};

window.showEpsgDropdown = function () {
  var dd = document.getElementById("epsg-dropdown");
  if (dd.innerHTML && dd.innerHTML.length > 10) dd.classList.add("open");
};

window.hideEpsgDropdown = function () {
  var dd = document.getElementById("epsg-dropdown");
  if (dd) dd.classList.remove("open");
};

function sp(code) {
  window.selectEpsgSetup(code, "EPSG:" + code);
}
