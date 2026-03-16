// ── Global state ──
window._sbState = {
  epsg: 'EPSG:5946',
  pending: [], ready: false,
  viewer: null, marker: null, lastPos: null,
  api: null, unsupportedEpsg: null
};
var S = window._sbState;
var _epsgSetupCode = "5946";
var _epsgSetupName = "NTM sone 6";
var _epsgSearchTimer = null;

var _epsgData = [
  // Norwegian NTM zones
  ['5941','NTM sone 1'],['5942','NTM sone 2'],['5943','NTM sone 3'],['5944','NTM sone 4'],
  ['5945','NTM sone 5'],['5946','NTM sone 6'],['5947','NTM sone 7'],['5948','NTM sone 8'],
  ['5949','NTM sone 9'],['5950','NTM sone 10'],
  // Norwegian UTM
  ['25832','ETRS89 / UTM zone 32N'],['25833','ETRS89 / UTM zone 33N'],['25834','ETRS89 / UTM zone 34N'],
  ['25835','ETRS89 / UTM zone 35N'],
  // WGS84 UTM
  ['32601','WGS 84 / UTM zone 1N'],['32602','WGS 84 / UTM zone 2N'],['32603','WGS 84 / UTM zone 3N'],
  ['32604','WGS 84 / UTM zone 4N'],['32605','WGS 84 / UTM zone 5N'],['32606','WGS 84 / UTM zone 6N'],
  ['32607','WGS 84 / UTM zone 7N'],['32608','WGS 84 / UTM zone 8N'],['32609','WGS 84 / UTM zone 9N'],
  ['32610','WGS 84 / UTM zone 10N'],['32611','WGS 84 / UTM zone 11N'],['32612','WGS 84 / UTM zone 12N'],
  ['32613','WGS 84 / UTM zone 13N'],['32614','WGS 84 / UTM zone 14N'],['32615','WGS 84 / UTM zone 15N'],
  ['32616','WGS 84 / UTM zone 16N'],['32617','WGS 84 / UTM zone 17N'],['32618','WGS 84 / UTM zone 18N'],
  ['32619','WGS 84 / UTM zone 19N'],['32620','WGS 84 / UTM zone 20N'],['32621','WGS 84 / UTM zone 21N'],
  ['32622','WGS 84 / UTM zone 22N'],['32623','WGS 84 / UTM zone 23N'],['32624','WGS 84 / UTM zone 24N'],
  ['32625','WGS 84 / UTM zone 25N'],['32626','WGS 84 / UTM zone 26N'],['32627','WGS 84 / UTM zone 27N'],
  ['32628','WGS 84 / UTM zone 28N'],['32629','WGS 84 / UTM zone 29N'],['32630','WGS 84 / UTM zone 30N'],
  ['32631','WGS 84 / UTM zone 31N'],['32632','WGS 84 / UTM zone 32N'],['32633','WGS 84 / UTM zone 33N'],
  ['32634','WGS 84 / UTM zone 34N'],['32635','WGS 84 / UTM zone 35N'],['32636','WGS 84 / UTM zone 36N'],
  ['32637','WGS 84 / UTM zone 37N'],['32638','WGS 84 / UTM zone 38N'],['32639','WGS 84 / UTM zone 39N'],
  ['32640','WGS 84 / UTM zone 40N'],['32641','WGS 84 / UTM zone 41N'],['32642','WGS 84 / UTM zone 42N'],
  ['32643','WGS 84 / UTM zone 43N'],['32644','WGS 84 / UTM zone 44N'],['32645','WGS 84 / UTM zone 45N'],
  ['32646','WGS 84 / UTM zone 46N'],['32647','WGS 84 / UTM zone 47N'],['32648','WGS 84 / UTM zone 48N'],
  ['32649','WGS 84 / UTM zone 49N'],['32650','WGS 84 / UTM zone 50N'],['32651','WGS 84 / UTM zone 51N'],
  ['32652','WGS 84 / UTM zone 52N'],['32653','WGS 84 / UTM zone 53N'],['32654','WGS 84 / UTM zone 54N'],
  ['32655','WGS 84 / UTM zone 55N'],['32656','WGS 84 / UTM zone 56N'],['32657','WGS 84 / UTM zone 57N'],
  ['32658','WGS 84 / UTM zone 58N'],['32659','WGS 84 / UTM zone 59N'],['32660','WGS 84 / UTM zone 60N'],
  // WGS84 UTM South
  ['32701','WGS 84 / UTM zone 1S'],['32720','WGS 84 / UTM zone 20S'],['32721','WGS 84 / UTM zone 21S'],
  ['32722','WGS 84 / UTM zone 22S'],['32730','WGS 84 / UTM zone 30S'],['32731','WGS 84 / UTM zone 31S'],
  ['32732','WGS 84 / UTM zone 32S'],['32733','WGS 84 / UTM zone 33S'],['32734','WGS 84 / UTM zone 34S'],
  ['32735','WGS 84 / UTM zone 35S'],['32736','WGS 84 / UTM zone 36S'],['32754','WGS 84 / UTM zone 54S'],
  ['32755','WGS 84 / UTM zone 55S'],['32756','WGS 84 / UTM zone 56S'],
  // Nordic / Scandinavian
  ['3006','SWEREF99 TM'],['3007','SWEREF99 12 00'],['3008','SWEREF99 13 30'],
  ['3009','SWEREF99 15 00'],['3010','SWEREF99 16 30'],['3011','SWEREF99 18 00'],
  ['3012','SWEREF99 14 15'],['3013','SWEREF99 15 45'],['3014','SWEREF99 17 15'],
  ['3015','SWEREF99 18 45'],['3016','SWEREF99 20 15'],['3017','SWEREF99 21 45'],
  ['3018','SWEREF99 23 15'],
  ['3067','ETRS89 / TM35FIN (Finland)'],
  ['25832','ETRS89 / UTM zone 32N (Denmark/Norway)'],
  ['4326','WGS 84'],['4258','ETRS89'],['4230','ED50'],
  // UK
  ['27700','OSGB 1936 / British National Grid'],['29902','TM65 / Irish Grid'],
  ['29903','TM75 / Irish Grid'],['2157','IRENET95 / Irish Transverse Mercator'],
  // Germany
  ['31466','DHDN / 3-degree Gauss-Kruger zone 2'],['31467','DHDN / 3-degree Gauss-Kruger zone 3'],
  ['31468','DHDN / 3-degree Gauss-Kruger zone 4'],['31469','DHDN / 3-degree Gauss-Kruger zone 5'],
  ['25832','ETRS89 / UTM zone 32N'],['25833','ETRS89 / UTM zone 33N'],
  // Netherlands
  ['28992','Amersfoort / RD New'],
  // France
  ['2154','RGF93 / Lambert-93'],['27571','NTF (Paris) / Lambert zone I'],
  ['27572','NTF (Paris) / Lambert zone II'],['27573','NTF (Paris) / Lambert zone III'],
  // Belgium
  ['31370','Belge 1972 / Belgian Lambert 72'],
  // Switzerland
  ['21781','CH1903 / LV03'],['2056','CH1903+ / LV95'],
  // Austria
  ['31254','MGI / Austria GK West'],['31255','MGI / Austria GK Central'],['31256','MGI / Austria GK East'],
  // USA
  ['4269','NAD83'],['4267','NAD27'],
  ['26901','NAD83 / UTM zone 1N'],['26910','NAD83 / UTM zone 10N'],['26911','NAD83 / UTM zone 11N'],
  ['26912','NAD83 / UTM zone 12N'],['26913','NAD83 / UTM zone 13N'],['26914','NAD83 / UTM zone 14N'],
  ['26915','NAD83 / UTM zone 15N'],['26916','NAD83 / UTM zone 16N'],['26917','NAD83 / UTM zone 17N'],
  ['26918','NAD83 / UTM zone 18N'],['26919','NAD83 / UTM zone 19N'],
  ['2263','NAD83 / New York Long Island'],['2264','NAD83 / North Carolina'],
  // Australia
  ['28354','GDA94 / MGA zone 54'],['28355','GDA94 / MGA zone 55'],['28356','GDA94 / MGA zone 56'],
  ['7854','GDA2020 / MGA zone 54'],['7855','GDA2020 / MGA zone 55'],['7856','GDA2020 / MGA zone 56'],
  // New Zealand
  ['2193','NZGD2000 / New Zealand Transverse Mercator 2000'],
  // Japan
  ['6669','JGD2011 / Japan Plane Rectangular CS I'],['6670','JGD2011 / Japan Plane Rectangular CS II'],
  ['6671','JGD2011 / Japan Plane Rectangular CS III'],
  // China
  ['4490','China Geodetic Coordinate System 2000'],
  ['4547','CGCS2000 / 3-degree Gauss-Kruger zone 38'],
  ['4548','CGCS2000 / 3-degree Gauss-Kruger zone 39'],
  // South Africa
  ['22235','Cape / UTM zone 35S'],['32634','WGS 84 / UTM zone 34N'],
  ['22275','Lo27/25'],['22277','Lo27/27'],['22279','Lo27/29'],
  // Brazil
  ['31982','SIRGAS 2000 / UTM zone 22S'],['31983','SIRGAS 2000 / UTM zone 23S'],
  ['31984','SIRGAS 2000 / UTM zone 24S'],
  // Middle East
  ['20436','Ain el Abd / UTM zone 36N'],['20437','Ain el Abd / UTM zone 37N'],
  ['20438','Ain el Abd / UTM zone 38N'],
  // India
  ['24378','Kalianpur 1937 / India zone I'],['24379','Kalianpur 1937 / India zone IIa'],
  ['32643','WGS 84 / UTM zone 43N'],['32644','WGS 84 / UTM zone 44N'],
  // Special / global
  ['3857','WGS 84 / Pseudo-Mercator (Web Mercator)'],
  ['5545','ETRS89 / NTM sone 5 (Norway)'],
  ['900913','Google Maps / Spherical Mercator'],
];

function epsgSearch(val) {
  val = val.toLowerCase().trim();
  var results = [];
  for (var i = 0; i < _epsgData.length; i++) {
    var code = _epsgData[i][0];
    var name = _epsgData[i][1];
    if (code.indexOf(val) !== -1 || name.toLowerCase().indexOf(val) !== -1) {
      results.push({code: code, name: name});
    }
    if (results.length >= 30) break;
  }
  return results;
}



// ── TM parameters for Norwegian NTM and UTM zones ──
var _tmParams = {
  'EPSG:5941': { lon0: 6.5,  lat0: 58, x0: 100000, y0: 1000000 },
  'EPSG:5942': { lon0: 7.5,  lat0: 58, x0: 100000, y0: 1000000 },
  'EPSG:5943': { lon0: 8.5,  lat0: 58, x0: 100000, y0: 1000000 },
  'EPSG:5944': { lon0: 9.5,  lat0: 58, x0: 100000, y0: 1000000 },
  'EPSG:5945': { lon0: 10.5, lat0: 58, x0: 100000, y0: 1000000 },
  'EPSG:5946': { lon0: 6.5,  lat0: 58, x0: 100000, y0: 1000000 },
  'EPSG:5947': { lon0: 7.5,  lat0: 58, x0: 100000, y0: 1000000 },
  'EPSG:5948': { lon0: 8.5,  lat0: 58, x0: 100000, y0: 1000000 },
  'EPSG:5949': { lon0: 9.5,  lat0: 58, x0: 100000, y0: 1000000 },
  'EPSG:5950': { lon0: 10.5, lat0: 58, x0: 100000, y0: 1000000 },
  'EPSG:5545': { lon0: 18.0, lat0: 0,  x0: 500000, y0: 0 },
  'EPSG:25832': { lon0: 9.0,  lat0: 0,  x0: 500000, y0: 0 },
  'EPSG:25833': { lon0: 15.0, lat0: 0,  x0: 500000, y0: 0 },
  'EPSG:32632': { lon0: 9.0,  lat0: 0,  x0: 500000, y0: 0 },
  'EPSG:32633': { lon0: 15.0, lat0: 0,  x0: 500000, y0: 0 }
};

function normalizeEpsgKey(value) {
  var epsgKey = value == null ? '' : String(value).trim().toUpperCase();
  if (!epsgKey) return '';
  if (epsgKey.indexOf('EPSG:') !== 0) epsgKey = 'EPSG:' + epsgKey.replace(/^EPSG/i, '').trim();
  return epsgKey;
}

function getTmParams(epsg) {
  var epsgKey = normalizeEpsgKey(epsg);
  return epsgKey && _tmParams[epsgKey] ? _tmParams[epsgKey] : null;
}

function setHeightReadout(rawAlt) {
  var el = document.getElementById('v-alt');
  if (!el || typeof rawAlt !== 'number' || isNaN(rawAlt)) return;
  el.textContent = 'H  ' + Math.abs(rawAlt).toFixed(1) + ' m';
}

function warnUnsupportedCrs(epsg, name) {
  var epsgKey = normalizeEpsgKey(epsg);
  var label = name ? epsgKey + ' — ' + name : epsgKey;
  var msg = 'CRS ikke støttet ennå: ' + label;
  var result = document.getElementById('measure-result');
  if (result) result.textContent = msg;
  _log(msg, 'warn');
}

function toWgs84(easting, northing) {
  var epsgKey = normalizeEpsgKey(S.epsg);
  var p = getTmParams(epsgKey);
  if (!p) {
    if (S.unsupportedEpsg !== epsgKey) {
      S.unsupportedEpsg = epsgKey;
      warnUnsupportedCrs(epsgKey);
    }
    return null;
  }
  S.unsupportedEpsg = null;
  var a=6378137.0, f=1/298.257222101;
  var b=a*(1-f), e2=1-(b/a)*(b/a), k0=1.0;
  var lon0=p.lon0*Math.PI/180, lat0=p.lat0*Math.PI/180;
  var x=easting-p.x0, y=northing-p.y0;
  var A0=1-e2/4-3*e2*e2/64-5*e2*e2*e2/256;
  var A2=3/8*(e2+e2*e2/4+15*e2*e2*e2/128);
  var A4=15/256*(e2*e2+3*e2*e2*e2/4);
  var A6=35*e2*e2*e2/3072;
  var M0=a*(A0*lat0-A2*Math.sin(2*lat0)+A4*Math.sin(4*lat0)-A6*Math.sin(6*lat0));
  var M=M0+y/k0, mu=M/(a*A0);
  var e1=(1-Math.sqrt(1-e2))/(1+Math.sqrt(1-e2));
  var lat_fp=mu+(3*e1/2-27*e1*e1*e1/32)*Math.sin(2*mu)
    +(21*e1*e1/16-55*e1*e1*e1*e1/32)*Math.sin(4*mu)
    +(151*e1*e1*e1/96)*Math.sin(6*mu)
    +(1097*e1*e1*e1*e1/512)*Math.sin(8*mu);
  var sinFP=Math.sin(lat_fp), cosFP=Math.cos(lat_fp), tanFP=Math.tan(lat_fp);
  var N1=a/Math.sqrt(1-e2*sinFP*sinFP);
  var T1=tanFP*tanFP, C1=e2/(1-e2)*cosFP*cosFP;
  var R1=a*(1-e2)/Math.pow(1-e2*sinFP*sinFP,1.5);
  var D=x/(N1*k0);
  var lat=lat_fp-(N1*tanFP/R1)*(D*D/2-(5+3*T1+10*C1-4*C1*C1-9*e2/(1-e2))*D*D*D*D/24);
  var lon=lon0+(D-(1+2*T1+C1)*D*D*D/6)/cosFP;
  return { lat: lat*180/Math.PI, lon: lon*180/Math.PI };
}


function _log(msg, cls) {
  var el = document.getElementById('log-list');
  if (!el) return;
  var d = document.createElement('div');
  d.textContent = '› ' + msg;
  if (cls) d.className = cls;
  el.appendChild(d);
  el.scrollTop = el.scrollHeight;
}
