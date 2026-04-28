const express = require('express');
const path = require('path');
const multer = require('multer');
const { XMLParser } = require('fast-xml-parser');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function extractPoints(parsed) {
  const gpx = parsed.gpx;
  if (!gpx) return [];

  const points = [];

  function collectFromPts(pts) {
    if (!pts) return;
    const arr = Array.isArray(pts) ? pts : [pts];
    for (const pt of arr) {
      const lat = parseFloat(pt['@_lat']);
      const lon = parseFloat(pt['@_lon']);
      const ele = pt.ele != null ? parseFloat(pt.ele) : null;
      if (!isNaN(lat) && !isNaN(lon)) points.push({ lat, lon, ele });
    }
  }

  const trk = gpx.trk;
  if (trk) {
    const trkArr = Array.isArray(trk) ? trk : [trk];
    for (const t of trkArr) {
      const segs = t.trkseg;
      if (!segs) continue;
      const segsArr = Array.isArray(segs) ? segs : [segs];
      for (const seg of segsArr) collectFromPts(seg.trkpt);
    }
  }

  if (points.length === 0) {
    const rte = gpx.rte;
    if (rte) {
      const rteArr = Array.isArray(rte) ? rte : [rte];
      for (const r of rteArr) collectFromPts(r.rtept);
    }
  }

  return points;
}

app.post('/api/gpx', upload.single('gpxFile'), (req, res) => {
  try {
    if (!req.file) return res.json({ success: false, error: 'No file uploaded' });

    const ext = (req.file.originalname || '').split('.').pop().toLowerCase();
    if (ext !== 'gpx') return res.json({ success: false, error: 'File must be a .gpx file' });

    const unit = (req.query.unit || 'km').toLowerCase();
    const segmentDistKm = unit === 'mile' ? 1.60934 : 1;

    const content = req.file.buffer.toString('utf8');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    let parsed;
    try {
      parsed = parser.parse(content);
    } catch (_) {
      return res.json({ success: false, error: 'Could not parse GPX file — file may be corrupt' });
    }

    const points = extractPoints(parsed);
    if (points.length < 2) {
      return res.json({ success: false, error: 'GPX file contains no valid track points' });
    }

    const hasElevation = points.some((p) => p.ele != null);

    // Build enriched points with cumulative distance
    let totalDistanceKm = 0;
    let totalAscent = 0;
    let totalDescent = 0;
    const enriched = [{ ...points[0], distKm: 0 }];

    for (let i = 1; i < points.length; i++) {
      const d = haversineKm(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon);
      totalDistanceKm += d;
      enriched.push({ ...points[i], distKm: totalDistanceKm });

      if (hasElevation && points[i].ele != null && points[i - 1].ele != null) {
        const diff = points[i].ele - points[i - 1].ele;
        if (diff > 0) totalAscent += diff;
        else totalDescent += Math.abs(diff);
      }
    }

    const totalSegments = Math.ceil(totalDistanceKm / segmentDistKm);
    const segments = [];

    for (let s = 0; s < totalSegments; s++) {
      const segStart = s * segmentDistKm;
      const segEnd = Math.min((s + 1) * segmentDistKm, totalDistanceKm);

      // Points within this segment (inclusive boundaries)
      const segPts = enriched.filter((p) => p.distKm >= segStart - 0.0001 && p.distKm <= segEnd + 0.0001);

      // Always include the interpolated boundary points
      if (segPts.length === 0) {
        segments.push({
          segment: s + 1,
          startElevation: 0,
          endElevation: 0,
          elevationGain: 0,
          elevationLoss: 0,
          netChange: 0,
          gradientPercent: 0,
        });
        continue;
      }

      let elevGain = 0;
      let elevLoss = 0;
      for (let i = 1; i < segPts.length; i++) {
        if (segPts[i].ele != null && segPts[i - 1].ele != null) {
          const diff = segPts[i].ele - segPts[i - 1].ele;
          if (diff > 0) elevGain += diff;
          else elevLoss += Math.abs(diff);
        }
      }

      const startEle = segPts[0].ele ?? 0;
      const endEle = segPts[segPts.length - 1].ele ?? 0;
      const netChange = endEle - startEle;
      const segLengthKm = segEnd - segStart;
      const gradientPercent = segLengthKm > 0 ? (netChange / (segLengthKm * 1000)) * 100 : 0;

      segments.push({
        segment: s + 1,
        startElevation: Math.round(startEle * 10) / 10,
        endElevation: Math.round(endEle * 10) / 10,
        elevationGain: Math.round(elevGain * 10) / 10,
        elevationLoss: Math.round(elevLoss * 10) / 10,
        netChange: Math.round(netChange * 10) / 10,
        gradientPercent: Math.round(gradientPercent * 10) / 10,
      });
    }

    res.json({
      success: true,
      summary: {
        totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
        totalAscent: Math.round(totalAscent),
        totalDescent: Math.round(totalDescent),
        pointCount: points.length,
      },
      segments,
    });
  } catch (err) {
    console.error('GPX parse error:', err);
    res.json({ success: false, error: 'Failed to process GPX file' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
