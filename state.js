// ── Global state ──
var CFG = window._sbConfig || {};
var _defaultEpsg = CFG.defaultEpsg || "EPSG:5946";
var _defaultEpsgCode = String(
  CFG.defaultEpsgCode || _defaultEpsg.replace(/^EPSG:/i, ""),
);
var _defaultEpsgName = CFG.defaultEpsgName || "NTM sone 6";

window._sbState = {
  epsg: _defaultEpsg,
  pending: [],
  ready: false,
  viewer: null,
  marker: null,
  lastPos: null,
  api: null,
  unsupportedEpsg: null,
};
var S = window._sbState;
S.nightMode = CFG.defaultNightMode === true;
S.baseMapMode = CFG.defaultBaseMapMode === "kart" ? "kart" : "foto";
var _epsgSetupCode = _defaultEpsgCode;
var _epsgSetupName = _defaultEpsgName;
var _epsgSearchTimer = null;

var _epsgData = [
  // Norwegian NTM zones
  ["5941", "NTM sone 1"],
  ["5942", "NTM sone 2"],
  ["5943", "NTM sone 3"],
  ["5944", "NTM sone 4"],
  ["5945", "NTM sone 5"],
  ["5946", "NTM sone 6"],
  ["5947", "NTM sone 7"],
  ["5948", "NTM sone 8"],
  ["5949", "NTM sone 9"],
  ["5950", "NTM sone 10"],
  // Norwegian UTM
  ["25832", "ETRS89 / UTM zone 32N"],
  ["25833", "ETRS89 / UTM zone 33N"],
  ["25834", "ETRS89 / UTM zone 34N"],
  ["25835", "ETRS89 / UTM zone 35N"],
  // WGS84 UTM
  ["32601", "WGS 84 / UTM zone 1N"],
  ["32602", "WGS 84 / UTM zone 2N"],
  ["32603", "WGS 84 / UTM zone 3N"],
  ["32604", "WGS 84 / UTM zone 4N"],
  ["32605", "WGS 84 / UTM zone 5N"],
  ["32606", "WGS 84 / UTM zone 6N"],
  ["32607", "WGS 84 / UTM zone 7N"],
  ["32608", "WGS 84 / UTM zone 8N"],
  ["32609", "WGS 84 / UTM zone 9N"],
  ["32610", "WGS 84 / UTM zone 10N"],
  ["32611", "WGS 84 / UTM zone 11N"],
  ["32612", "WGS 84 / UTM zone 12N"],
  ["32613", "WGS 84 / UTM zone 13N"],
  ["32614", "WGS 84 / UTM zone 14N"],
  ["32615", "WGS 84 / UTM zone 15N"],
  ["32616", "WGS 84 / UTM zone 16N"],
  ["32617", "WGS 84 / UTM zone 17N"],
  ["32618", "WGS 84 / UTM zone 18N"],
  ["32619", "WGS 84 / UTM zone 19N"],
  ["32620", "WGS 84 / UTM zone 20N"],
  ["32621", "WGS 84 / UTM zone 21N"],
  ["32622", "WGS 84 / UTM zone 22N"],
  ["32623", "WGS 84 / UTM zone 23N"],
  ["32624", "WGS 84 / UTM zone 24N"],
  ["32625", "WGS 84 / UTM zone 25N"],
  ["32626", "WGS 84 / UTM zone 26N"],
  ["32627", "WGS 84 / UTM zone 27N"],
  ["32628", "WGS 84 / UTM zone 28N"],
  ["32629", "WGS 84 / UTM zone 29N"],
  ["32630", "WGS 84 / UTM zone 30N"],
  ["32631", "WGS 84 / UTM zone 31N"],
  ["32632", "WGS 84 / UTM zone 32N"],
  ["32633", "WGS 84 / UTM zone 33N"],
  ["32634", "WGS 84 / UTM zone 34N"],
  ["32635", "WGS 84 / UTM zone 35N"],
  ["32636", "WGS 84 / UTM zone 36N"],
  ["32637", "WGS 84 / UTM zone 37N"],
  ["32638", "WGS 84 / UTM zone 38N"],
  ["32639", "WGS 84 / UTM zone 39N"],
  ["32640", "WGS 84 / UTM zone 40N"],
  ["32641", "WGS 84 / UTM zone 41N"],
  ["32642", "WGS 84 / UTM zone 42N"],
  ["32643", "WGS 84 / UTM zone 43N"],
  ["32644", "WGS 84 / UTM zone 44N"],
  ["32645", "WGS 84 / UTM zone 45N"],
  ["32646", "WGS 84 / UTM zone 46N"],
  ["32647", "WGS 84 / UTM zone 47N"],
  ["32648", "WGS 84 / UTM zone 48N"],
  ["32649", "WGS 84 / UTM zone 49N"],
  ["32650", "WGS 84 / UTM zone 50N"],
  ["32651", "WGS 84 / UTM zone 51N"],
  ["32652", "WGS 84 / UTM zone 52N"],
  ["32653", "WGS 84 / UTM zone 53N"],
  ["32654", "WGS 84 / UTM zone 54N"],
  ["32655", "WGS 84 / UTM zone 55N"],
  ["32656", "WGS 84 / UTM zone 56N"],
  ["32657", "WGS 84 / UTM zone 57N"],
  ["32658", "WGS 84 / UTM zone 58N"],
  ["32659", "WGS 84 / UTM zone 59N"],
  ["32660", "WGS 84 / UTM zone 60N"],
  // WGS84 UTM South
  ["32701", "WGS 84 / UTM zone 1S"],
  ["32720", "WGS 84 / UTM zone 20S"],
  ["32721", "WGS 84 / UTM zone 21S"],
  ["32722", "WGS 84 / UTM zone 22S"],
  ["32730", "WGS 84 / UTM zone 30S"],
  ["32731", "WGS 84 / UTM zone 31S"],
  ["32732", "WGS 84 / UTM zone 32S"],
  ["32733", "WGS 84 / UTM zone 33S"],
  ["32734", "WGS 84 / UTM zone 34S"],
  ["32735", "WGS 84 / UTM zone 35S"],
  ["32736", "WGS 84 / UTM zone 36S"],
  ["32754", "WGS 84 / UTM zone 54S"],
  ["32755", "WGS 84 / UTM zone 55S"],
  ["32756", "WGS 84 / UTM zone 56S"],
  // Nordic / Scandinavian
  ["3006", "SWEREF99 TM"],
  ["3007", "SWEREF99 12 00"],
  ["3008", "SWEREF99 13 30"],
  ["3009", "SWEREF99 15 00"],
  ["3010", "SWEREF99 16 30"],
  ["3011", "SWEREF99 18 00"],
  ["3012", "SWEREF99 14 15"],
  ["3013", "SWEREF99 15 45"],
  ["3014", "SWEREF99 17 15"],
  ["3015", "SWEREF99 18 45"],
  ["3016", "SWEREF99 20 15"],
  ["3017", "SWEREF99 21 45"],
  ["3018", "SWEREF99 23 15"],
  ["3067", "ETRS89 / TM35FIN (Finland)"],
  ["25832", "ETRS89 / UTM zone 32N (Denmark/Norway)"],
  ["4326", "WGS 84"],
  ["4258", "ETRS89"],
  ["4230", "ED50"],
  // UK
  ["27700", "OSGB 1936 / British National Grid"],
  ["29902", "TM65 / Irish Grid"],
  ["29903", "TM75 / Irish Grid"],
  ["2157", "IRENET95 / Irish Transverse Mercator"],
  // Germany
  ["31466", "DHDN / 3-degree Gauss-Kruger zone 2"],
  ["31467", "DHDN / 3-degree Gauss-Kruger zone 3"],
  ["31468", "DHDN / 3-degree Gauss-Kruger zone 4"],
  ["31469", "DHDN / 3-degree Gauss-Kruger zone 5"],
  ["25832", "ETRS89 / UTM zone 32N"],
  ["25833", "ETRS89 / UTM zone 33N"],
  // Netherlands
  ["28992", "Amersfoort / RD New"],
  // France
  ["2154", "RGF93 / Lambert-93"],
  ["27571", "NTF (Paris) / Lambert zone I"],
  ["27572", "NTF (Paris) / Lambert zone II"],
  ["27573", "NTF (Paris) / Lambert zone III"],
  // Belgium
  ["31370", "Belge 1972 / Belgian Lambert 72"],
  // Switzerland
  ["21781", "CH1903 / LV03"],
  ["2056", "CH1903+ / LV95"],
  // Austria
  ["31254", "MGI / Austria GK West"],
  ["31255", "MGI / Austria GK Central"],
  ["31256", "MGI / Austria GK East"],
  // USA
  ["4269", "NAD83"],
  ["4267", "NAD27"],
  ["26901", "NAD83 / UTM zone 1N"],
  ["26910", "NAD83 / UTM zone 10N"],
  ["26911", "NAD83 / UTM zone 11N"],
  ["26912", "NAD83 / UTM zone 12N"],
  ["26913", "NAD83 / UTM zone 13N"],
  ["26914", "NAD83 / UTM zone 14N"],
  ["26915", "NAD83 / UTM zone 15N"],
  ["26916", "NAD83 / UTM zone 16N"],
  ["26917", "NAD83 / UTM zone 17N"],
  ["26918", "NAD83 / UTM zone 18N"],
  ["26919", "NAD83 / UTM zone 19N"],
  ["2263", "NAD83 / New York Long Island"],
  ["2264", "NAD83 / North Carolina"],
  // Australia
  ["28354", "GDA94 / MGA zone 54"],
  ["28355", "GDA94 / MGA zone 55"],
  ["28356", "GDA94 / MGA zone 56"],
  ["7854", "GDA2020 / MGA zone 54"],
  ["7855", "GDA2020 / MGA zone 55"],
  ["7856", "GDA2020 / MGA zone 56"],
  // New Zealand
  ["2193", "NZGD2000 / New Zealand Transverse Mercator 2000"],
  // Japan
  ["6669", "JGD2011 / Japan Plane Rectangular CS I"],
  ["6670", "JGD2011 / Japan Plane Rectangular CS II"],
  ["6671", "JGD2011 / Japan Plane Rectangular CS III"],
  // China
  ["4490", "China Geodetic Coordinate System 2000"],
  ["4547", "CGCS2000 / 3-degree Gauss-Kruger zone 38"],
  ["4548", "CGCS2000 / 3-degree Gauss-Kruger zone 39"],
  // South Africa
  ["22235", "Cape / UTM zone 35S"],
  ["32634", "WGS 84 / UTM zone 34N"],
  ["22275", "Lo27/25"],
  ["22277", "Lo27/27"],
  ["22279", "Lo27/29"],
  // Brazil
  ["31982", "SIRGAS 2000 / UTM zone 22S"],
  ["31983", "SIRGAS 2000 / UTM zone 23S"],
  ["31984", "SIRGAS 2000 / UTM zone 24S"],
  // Middle East
  ["20436", "Ain el Abd / UTM zone 36N"],
  ["20437", "Ain el Abd / UTM zone 37N"],
  ["20438", "Ain el Abd / UTM zone 38N"],
  // India
  ["24378", "Kalianpur 1937 / India zone I"],
  ["24379", "Kalianpur 1937 / India zone IIa"],
  ["32643", "WGS 84 / UTM zone 43N"],
  ["32644", "WGS 84 / UTM zone 44N"],
  // Special / global
  ["3857", "WGS 84 / Pseudo-Mercator (Web Mercator)"],
  ["5545", "ETRS89 / NTM sone 5 (Norway)"],
  ["900913", "Google Maps / Spherical Mercator"],
];

function epsgSearch(val) {
  val = val.toLowerCase().trim();
  var results = [];
  for (var i = 0; i < _epsgData.length; i++) {
    var code = _epsgData[i][0];
    var name = _epsgData[i][1];
    if (code.indexOf(val) !== -1 || name.toLowerCase().indexOf(val) !== -1) {
      results.push({ code: code, name: name });
    }
    if (results.length >= 30) break;
  }
  return results;
}

// ── TM parameters for Norwegian NTM and UTM zones ──
var _projectionDefs = buildProjectionDefs();

function buildNtmDef(zone) {
  return (
    "+proj=tmerc +lat_0=58 +lon_0=" +
    (zone + 0.5) +
    " +k=1 +x_0=100000 +y_0=1000000 +ellps=GRS80 +units=m +no_defs +type=crs"
  );
}

function buildEtrsUtmDef(zone) {
  return (
    "+proj=utm +zone=" +
    zone +
    " +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
  );
}

function buildWgs84UtmDef(zone, south) {
  return (
    "+proj=utm +zone=" +
    zone +
    (south ? " +south" : "") +
    " +datum=WGS84 +units=m +no_defs +type=crs"
  );
}

function buildSweref99Def(code) {
  var zones = {
    "3006": { lon0: 15.0, k: 0.9996, x0: 500000, y0: 0 },
    "3007": { lon0: 12.0, k: 1.0, x0: 150000, y0: 0 },
    "3008": { lon0: 13.5, k: 1.0, x0: 150000, y0: 0 },
    "3009": { lon0: 15.0, k: 1.0, x0: 150000, y0: 0 },
    "3010": { lon0: 16.5, k: 1.0, x0: 150000, y0: 0 },
    "3011": { lon0: 18.0, k: 1.0, x0: 150000, y0: 0 },
    "3012": { lon0: 14.25, k: 1.0, x0: 150000, y0: 0 },
    "3013": { lon0: 15.75, k: 1.0, x0: 150000, y0: 0 },
    "3014": { lon0: 17.25, k: 1.0, x0: 150000, y0: 0 },
    "3015": { lon0: 18.75, k: 1.0, x0: 150000, y0: 0 },
    "3016": { lon0: 20.25, k: 1.0, x0: 150000, y0: 0 },
    "3017": { lon0: 21.75, k: 1.0, x0: 150000, y0: 0 },
    "3018": { lon0: 23.25, k: 1.0, x0: 150000, y0: 0 },
  };
  var cfg = zones[String(code || "")];
  if (!cfg) return "";
  return (
    "+proj=tmerc +lat_0=0 +lon_0=" +
    cfg.lon0 +
    " +k=" +
    cfg.k +
    " +x_0=" +
    cfg.x0 +
    " +y_0=" +
    cfg.y0 +
    " +ellps=GRS80 +units=m +no_defs +type=crs"
  );
}

function buildProjectionDefs() {
  var defs = {
    "EPSG:4230": "+proj=longlat +datum=ED50 +no_defs +type=crs",
    "EPSG:4258": "+proj=longlat +ellps=GRS80 +no_defs +type=crs",
    "EPSG:4326": "+proj=longlat +datum=WGS84 +no_defs +type=crs",
    "EPSG:3857":
      "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs",
    "EPSG:900913":
      "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs",
  };
  var zone;
  for (zone = 1; zone <= 10; zone++) {
    defs["EPSG:" + (5940 + zone)] = buildNtmDef(zone);
  }
  [
    "3006",
    "3007",
    "3008",
    "3009",
    "3010",
    "3011",
    "3012",
    "3013",
    "3014",
    "3015",
    "3016",
    "3017",
    "3018",
  ].forEach(function (code) {
    var def = buildSweref99Def(code);
    if (def) defs["EPSG:" + code] = def;
  });
  for (zone = 32; zone <= 35; zone++) {
    defs["EPSG:258" + zone] = buildEtrsUtmDef(zone);
  }
  for (zone = 1; zone <= 60; zone++) {
    defs["EPSG:" + (32600 + zone)] = buildWgs84UtmDef(zone, false);
    defs["EPSG:" + (32700 + zone)] = buildWgs84UtmDef(zone, true);
  }
  return defs;
}

function normalizeEpsgKey(value) {
  var epsgKey = value == null ? "" : String(value).trim().toUpperCase();
  if (!epsgKey) return "";
  if (epsgKey.indexOf("EPSG:") !== 0)
    epsgKey = "EPSG:" + epsgKey.replace(/^EPSG/i, "").trim();
  return epsgKey;
}

function getProjectionDef(epsg) {
  var epsgKey = normalizeEpsgKey(epsg);
  return epsgKey && _projectionDefs[epsgKey] ? _projectionDefs[epsgKey] : null;
}

function getTmParams(epsg) {
  return getProjectionDef(epsg);
}

function ensureProjectionDefs() {
  if (
    typeof window.proj4 !== "function" ||
    typeof window.proj4.defs !== "function"
  )
    return false;
  if (ensureProjectionDefs._loaded) return true;
  Object.keys(_projectionDefs).forEach(function (epsgKey) {
    window.proj4.defs(epsgKey, _projectionDefs[epsgKey]);
  });
  ensureProjectionDefs._loaded = true;
  return true;
}

function setHeightReadout(rawAlt) {
  var el = document.getElementById("v-alt");
  if (!el || typeof rawAlt !== "number" || isNaN(rawAlt)) return;
  el.textContent = "H  " + Math.abs(rawAlt).toFixed(1) + " m";
}

function warnUnsupportedCrs(epsg, name, reason) {
  var epsgKey = normalizeEpsgKey(epsg);
  var label = name ? epsgKey + " - " + name : epsgKey;
  var msg = reason
    ? "CRS utilgjengelig: " + label + " (" + reason + ")"
    : "CRS ikke stottet enna: " + label;
  var result = document.getElementById("measure-result");
  if (result) result.textContent = msg;
  _log(msg, "warn");
}

function toWgs84(easting, northing) {
  var epsgKey = normalizeEpsgKey(S.epsg);
  var projDef = getProjectionDef(epsgKey);
  if (!projDef) {
    if (S.unsupportedEpsg !== epsgKey) {
      S.unsupportedEpsg = epsgKey;
      warnUnsupportedCrs(epsgKey);
    }
    return null;
  }
  if (!ensureProjectionDefs()) {
    if (S.unsupportedEpsg !== epsgKey + ":proj4") {
      S.unsupportedEpsg = epsgKey + ":proj4";
      warnUnsupportedCrs(epsgKey, null, "proj4 lastet ikke");
    }
    return null;
  }
  S.unsupportedEpsg = null;
  try {
    var wgs = window.proj4(epsgKey, "EPSG:4326", [
      Number(easting),
      Number(northing),
    ]);
    if (!wgs || wgs.length < 2 || isNaN(wgs[0]) || isNaN(wgs[1])) {
      throw new Error("ugyldig transformresultat");
    }
    return { lat: wgs[1], lon: wgs[0] };
  } catch (err) {
    console.warn("CRS transform failed for " + epsgKey, err);
    if (S.unsupportedEpsg !== epsgKey + ":transform") {
      S.unsupportedEpsg = epsgKey + ":transform";
      warnUnsupportedCrs(
        epsgKey,
        null,
        err && err.message ? err.message : "transformfeil",
      );
    }
    return null;
  }
}

function _log(msg, cls) {
  var el = document.getElementById("log-list");
  if (!el) return;
  var d = document.createElement("div");
  d.textContent = "› " + msg;
  if (cls) d.className = cls;
  el.appendChild(d);
  el.scrollTop = el.scrollHeight;
}
