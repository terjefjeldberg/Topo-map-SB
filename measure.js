window.toggleMeasure = function() { if (typeof _toggleMeasure==='function') _toggleMeasure(); };
window.toggleArea = function() { if (typeof _toggleArea==='function') _toggleArea(); };

// ── MEASURE TOOL ──────────────────────────────────────────────────────────
var _measureActive = false;
var _measurePoints = [];
var _measureEntities = [];

function _toggleMeasure() {
  _measureActive = !_measureActive;
  var btn = document.getElementById('measure-btn');
  btn.classList.toggle('active', _measureActive);
  if (!_measureActive) {
    clearMeasure();
    document.getElementById('measure-result').textContent = '';
  } else {
    document.getElementById('measure-result').textContent = 'Klikk punkt 1…';
  }
}

function clearMeasure() {
  _measurePoints = [];
  _measureEntities.forEach(function(e) { S.viewer.entities.remove(e); });
  _measureEntities = [];
}

function haversineM(lat1, lon1, lat2, lon2) {
  var R = 6371000;
  var dLat = (lat2-lat1)*Math.PI/180;
  var dLon = (lon2-lon1)*Math.PI/180;
  var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
          Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*
          Math.sin(dLon/2)*Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Hook into Cesium click for measure
function initMeasureHandler() {
  var handler = new Cesium.ScreenSpaceEventHandler(S.viewer.scene.canvas);
  handler.setInputAction(function(click) {
    if (!_measureActive) return;
    var ray = S.viewer.camera.getPickRay(click.position);
    var pos = S.viewer.scene.globe.pick(ray, S.viewer.scene);
    if (!pos) return;
    var carto = Cesium.Cartographic.fromCartesian(pos);
    var lat = Cesium.Math.toDegrees(carto.latitude);
    var lon = Cesium.Math.toDegrees(carto.longitude);
    var alt = carto.height;

    _measurePoints.push({lat:lat, lon:lon, alt:alt});

    // Add dot
    _measureEntities.push(S.viewer.entities.add({
      position: pos,
      point: { pixelSize: 8, color: Cesium.Color.fromCssColorString('#00d4ff'), outlineColor: Cesium.Color.WHITE, outlineWidth: 1 }
    }));

    if (_measurePoints.length === 1) {
      document.getElementById('measure-result').textContent = 'Klikk punkt 2…';
    } else if (_measurePoints.length === 2) {
      var p1 = _measurePoints[0], p2 = _measurePoints[1];
      var hDist = haversineM(p1.lat, p1.lon, p2.lat, p2.lon);
      var vDiff = p2.alt - p1.alt;
      var slope3d = Math.sqrt(hDist*hDist + vDiff*vDiff);
      var grade = hDist > 0 ? (vDiff/hDist*100).toFixed(1) : '0.0';

      // Draw line
      _measureEntities.push(S.viewer.entities.add({
        polyline: {
          positions: [Cesium.Cartesian3.fromDegrees(p1.lon,p1.lat,p1.alt),
                      Cesium.Cartesian3.fromDegrees(p2.lon,p2.lat,p2.alt)],
          width: 2,
          material: new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString('#00d4ff').withAlpha(0.85)),
          clampToGround: false
        }
      }));

      // Label midpoint
      var midLat = (p1.lat+p2.lat)/2, midLon = (p1.lon+p2.lon)/2, midAlt = (p1.alt+p2.alt)/2+20;
      var distTxt = hDist >= 1000 ? (hDist/1000).toFixed(2)+' km' : Math.round(hDist)+' m';
      _measureEntities.push(S.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(midLon, midLat, midAlt),
        label: {
          text: distTxt,
          font: '13px DM Mono, monospace',
          fillColor: Cesium.Color.fromCssColorString('#00d4ff'),
          outlineColor: Cesium.Color.BLACK, outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -8)
        }
      }));

      var res = distTxt + ' horiz';
      if (Math.abs(vDiff) > 0.5) res += '  |  ' + (vDiff>0?'+':'') + vDiff.toFixed(1)+'m  |  stigning '+grade+'%';
      document.getElementById('measure-result').textContent = res;

      // Draw height profile between the two points
      drawProfile(p1, p2);

      _measurePoints = [];
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// ── HEIGHT PROFILE ─────────────────────────────────────────────────────────
function drawProfile(p1, p2) {
  var panel = document.getElementById('profile-panel');
  var canvas = document.getElementById('profile-canvas');
  panel.style.display = 'block';
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  var steps = 40;
  var positions = [];
  for (var i = 0; i <= steps; i++) {
    var t = i/steps;
    positions.push(Cesium.Cartographic.fromDegrees(
      p1.lon + (p2.lon-p1.lon)*t,
      p1.lat + (p2.lat-p1.lat)*t
    ));
  }

  Cesium.sampleTerrainMostDetailed(S.viewer.terrainProvider, positions).then(function(sampled) {
    var alts = sampled.map(function(p){ return p.height || 0; });
    var minA = Math.min.apply(null, alts);
    var maxA = Math.max.apply(null, alts);
    var range = Math.max(maxA - minA, 1);

    ctx.clearRect(0,0,W,H);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,212,255,0.1)';
    ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var gy = H - (g/4)*(H-20) - 10;
      ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke();
      ctx.fillStyle = 'rgba(0,212,255,0.5)';
      ctx.font = '9px DM Mono, monospace';
      ctx.fillText(Math.round(minA + (g/4)*range)+'m', 2, gy-2);
    }

    // Fill
    ctx.beginPath();
    ctx.moveTo(0, H);
    alts.forEach(function(a, i) {
      var x = (i/steps)*W;
      var y = H - 10 - ((a-minA)/range)*(H-20);
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    var grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'rgba(0,212,255,0.5)');
    grad.addColorStop(1,'rgba(0,212,255,0.05)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1.5;
    alts.forEach(function(a, i) {
      var x = (i/steps)*W;
      var y = H - 10 - ((a-minA)/range)*(H-20);
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.stroke();

    // Start/end labels
    var hDist = haversineM(p1.lat, p1.lon, p2.lat, p2.lon);
    var distTxt = hDist >= 1000 ? (hDist/1000).toFixed(1)+'km' : Math.round(hDist)+'m';
    ctx.fillStyle = 'rgba(0,212,255,0.7)';
    ctx.font = '9px DM Mono, monospace';
    ctx.fillText('0', 2, H-2);
    ctx.fillText(distTxt, W-30, H-2);
  });
}

// ── AREA TOOL ──────────────────────────────────────────────────────────────
var _areaActive = false;
var _areaPoints = [];
var _areaEntities = [];

function _toggleArea() {
  _areaActive = !_areaActive;
  var btn = document.getElementById('area-btn');
  btn.classList.toggle('active', _areaActive);

  // Turn off measure if active
  if (_areaActive && _measureActive) toggleMeasure();

  if (!_areaActive) {
    clearArea();
    document.getElementById('measure-result').textContent = '';
  } else {
    document.getElementById('measure-result').textContent = 'Klikk punkter — dobbeltklikk for å avslutte';
  }
}

function clearArea() {
  _areaPoints = [];
  _areaEntities.forEach(function(e) { S.viewer.entities.remove(e); });
  _areaEntities = [];
}

// Shoelace formula on flat lat/lon → convert to m²
function calcAreaM2(pts) {
  if (pts.length < 3) return 0;
  // Project to approximate metres using midpoint lat
  var midLat = pts.reduce(function(s,p){return s+p.lat;},0)/pts.length;
  var metersPerDegLat = 111320;
  var metersPerDegLon = 111320 * Math.cos(midLat * Math.PI/180);
  var area = 0;
  var n = pts.length;
  for (var i = 0; i < n; i++) {
    var j = (i+1) % n;
    var xi = pts[i].lon * metersPerDegLon;
    var yi = pts[i].lat * metersPerDegLat;
    var xj = pts[j].lon * metersPerDegLon;
    var yj = pts[j].lat * metersPerDegLat;
    area += xi * yj - xj * yi;
  }
  return Math.abs(area) / 2;
}

function formatArea(m2) {
  if (m2 >= 1e6) return (m2/1e6).toFixed(3) + ' km²';
  if (m2 >= 10000) return (m2/10000).toFixed(2) + ' daa (dekar)';
  return Math.round(m2) + ' m²';
}

function redrawAreaPolygon() {
  // Remove old polygon/line entities (keep dots = first _areaPoints.length entities)
  while (_areaEntities.length > _areaPoints.length) {
    S.viewer.entities.remove(_areaEntities.pop());
  }
  if (_areaPoints.length < 2) return;

  var positions = _areaPoints.map(function(p) {
    return Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt + 2);
  });

  if (_areaPoints.length >= 3) {
    // Filled polygon
    var polyPositions = _areaPoints.map(function(p) {
      return Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt + 1);
    });
    _areaEntities.push(S.viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(polyPositions),
        material: Cesium.Color.fromCssColorString('#00d4ff').withAlpha(0.18),
        outline: false,
        perPositionHeight: true
      }
    }));
  }

  // Outline
  var linePos = positions.concat([positions[0]]);
  _areaEntities.push(S.viewer.entities.add({
    polyline: {
      positions: linePos,
      width: 2,
      material: new Cesium.ColorMaterialProperty(
        Cesium.Color.fromCssColorString('#00d4ff').withAlpha(0.85)
      ),
      clampToGround: false
    }
  }));

  if (_areaPoints.length >= 3) {
    var area = calcAreaM2(_areaPoints);
    document.getElementById('measure-result').textContent =
      '⬡ ' + formatArea(area) + '  (' + _areaPoints.length + ' pts)';
  }
}

function initAreaHandler() {
  var handler = new Cesium.ScreenSpaceEventHandler(S.viewer.scene.canvas);

  handler.setInputAction(function(click) {
    if (!_areaActive) return;
    var ray = S.viewer.camera.getPickRay(click.position);
    var pos = S.viewer.scene.globe.pick(ray, S.viewer.scene);
    if (!pos) return;
    var carto = Cesium.Cartographic.fromCartesian(pos);
    var lat = Cesium.Math.toDegrees(carto.latitude);
    var lon = Cesium.Math.toDegrees(carto.longitude);
    var alt = carto.height;

    _areaPoints.push({lat:lat, lon:lon, alt:alt});

    // Dot
    _areaEntities.push(S.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, alt + 2),
      point: {
        pixelSize: 7,
        color: Cesium.Color.fromCssColorString('#00d4ff'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1
      }
    }));

    redrawAreaPolygon();

    if (_areaPoints.length === 1) {
      document.getElementById('measure-result').textContent = 'Klikk neste punkt — dobbeltklikk for å avslutte';
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction(function(click) {
    if (!_areaActive) return;
    // Finalise on double-click
    if (_areaPoints.length >= 3) {
      var area = calcAreaM2(_areaPoints);
      var perimeter = 0;
      for (var i = 0; i < _areaPoints.length; i++) {
        var j = (i+1) % _areaPoints.length;
        perimeter += haversineM(_areaPoints[i].lat, _areaPoints[i].lon,
                                _areaPoints[j].lat, _areaPoints[j].lon);
      }
      var perimTxt = perimeter >= 1000
        ? (perimeter/1000).toFixed(2) + ' km'
        : Math.round(perimeter) + ' m';
      document.getElementById('measure-result').textContent =
        '⬡ ' + formatArea(area) + '   omk: ' + perimTxt;
    }
    _areaActive = false;
    document.getElementById('area-btn').classList.remove('active');
    _areaPoints = [];
  }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
}

// Init measure handler when globe is ready
var _measureInited = false;
