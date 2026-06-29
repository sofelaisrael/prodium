function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function generateBlobPath(cx, cy, baseR, points, irregularity, rng, coverRect) {
  var harmonics = []
  for (var h = 0; h < 5; h++) {
    harmonics.push({
      freq: 2 + Math.floor(rng() * 6),
      phase: rng() * Math.PI * 2,
      amp: (0.5 + rng() * 0.7) / (h + 1)
    })
  }

  var left = coverRect.x, right = coverRect.x + coverRect.w
  var top = coverRect.y, bottom = coverRect.y + coverRect.h

  function minRadiusForAngle(angle) {
    var dirX = Math.cos(angle), dirY = Math.sin(angle)
    var tMax = Infinity
    if (dirX > 1e-6) tMax = Math.min(tMax, (right - cx) / dirX)
    else if (dirX < -1e-6) tMax = Math.min(tMax, (left - cx) / dirX)
    if (dirY > 1e-6) tMax = Math.min(tMax, (bottom - cy) / dirY)
    else if (dirY < -1e-6) tMax = Math.min(tMax, (top - cy) / dirY)
    if (!isFinite(tMax) || tMax < 0) return 0
    return tMax
  }

  var angleStep = (Math.PI * 2) / points
  var oversample = 6
  function worstFloorNear(angle) {
    var worst = 0
    for (var o = -oversample; o <= oversample; o++) {
      var f = minRadiusForAngle(angle + (o / oversample) * (angleStep / 2))
      if (f > worst) worst = f
    }
    return worst
  }

  var pts = []
  for (var i = 0; i < points; i++) {
    var angle = i * angleStep
    var noise = 0
    for (var hh = 0; hh < harmonics.length; hh++) {
      noise += Math.sin(angle * harmonics[hh].freq + harmonics[hh].phase) * harmonics[hh].amp
    }
    var outwardNoise = noise * irregularity
    var floor = worstFloorNear(angle) * 1.35 + 8
    var r = Math.max(baseR, floor) * (1 + outwardNoise)
    pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r])
  }

  var d = 'M ' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1) + ' '
  var n = pts.length
  for (var k = 0; k < n; k++) {
    var p0 = pts[(k - 1 + n) % n], p1 = pts[k], p2 = pts[(k + 1) % n], p3 = pts[(k + 2) % n]
    var c1x = p1[0] + (p2[0] - p0[0]) / 3, c1y = p1[1] + (p2[1] - p0[1]) / 3
    var c2x = p2[0] - (p3[0] - p1[0]) / 3, c2y = p2[1] - (p3[1] - p1[1]) / 3
    d += 'C ' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1) + ' '
  }
  return d + 'Z'
}

function hashStr(str) {
  var hash = 0
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export default function Blob({ id, className = '', size = 'full' }) {
  var seed = hashStr(id || 'default')
  var rng = mulberry32(seed)

  var w = 320, h = 200
  var safeZone = { x: 40, y: 30, w: w - 80, h: h - 60 }
  var cx = safeZone.x + safeZone.w * (0.3 + rng() * 0.4)
  var cy = safeZone.y + safeZone.h * (0.3 + rng() * 0.4)
  var baseR = size === 'sm' ? 30 : 70
  var pathData = generateBlobPath(cx, cy, baseR, 8 + Math.floor(rng() * 4), 0.6, rng, safeZone)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} xmlns="http://www.w3.org/2000/svg">
      <path d={pathData} fill="black" />
    </svg>
  )
}
