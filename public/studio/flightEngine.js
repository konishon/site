/**
 * Flight Engine: Ingestion, Spline Interpolation & Trajectory Simulation
 * Exact client-side JavaScript port of the flightvid/data.py and flightvid/core.py Python pipeline.
 * Author: Nishon Tandukar (konishon)
 */

export class PchipInterpolator {
  constructor(xs, ys) {
    this.xs = xs;
    this.ys = ys;
    const n = xs.length;
    this.n = n;
    const h = [];
    const delta = [];
    for (let i = 0; i < n - 1; i++) {
      h.push(xs[i + 1] - xs[i]);
      delta.push((ys[i + 1] - ys[i]) / h[i]);
    }
    const d = new Array(n).fill(0);
    if (n === 2) {
      d[0] = delta[0];
      d[1] = delta[0];
    } else {
      // Endpoint 0
      let d0 = ((2 * h[0] + h[1]) * delta[0] - h[0] * delta[1]) / (h[0] + h[1]);
      if (d0 * delta[0] <= 0) d0 = 0;
      else if (delta[0] * delta[1] <= 0 && Math.abs(d0) > 3 * Math.abs(delta[0])) d0 = 3 * delta[0];
      d[0] = d0;

      // Interior slopes (weighted harmonic mean)
      for (let k = 1; k < n - 1; k++) {
        if (delta[k - 1] * delta[k] > 0) {
          const w1 = 2 * h[k] + h[k - 1];
          const w2 = h[k] + 2 * h[k - 1];
          d[k] = (w1 + w2) / (w1 / delta[k - 1] + w2 / delta[k]);
        } else {
          d[k] = 0;
        }
      }

      // Endpoint n-1
      let dn = ((2 * h[n - 2] + h[n - 3]) * delta[n - 2] - h[n - 2] * delta[n - 3]) / (h[n - 2] + h[n - 3]);
      if (dn * delta[n - 2] <= 0) dn = 0;
      else if (delta[n - 2] * delta[n - 3] <= 0 && Math.abs(dn) > 3 * Math.abs(delta[n - 2])) dn = 3 * delta[n - 2];
      d[n - 1] = dn;
    }
    this.h = h;
    this.d = d;
  }

  eval(x) {
    const { xs, ys, h, d, n } = this;
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];

    let low = 0, high = n - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (xs[mid] <= x) low = mid + 1;
      else high = mid - 1;
    }
    const k = Math.max(0, Math.min(n - 2, high));
    const s = (x - xs[k]) / h[k];
    const s2 = s * s;
    const s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1;
    const h10 = s3 - 2 * s2 + s;
    const h01 = -2 * s3 + 3 * s2;
    const h11 = s3 - s2;
    return h00 * ys[k] + h10 * h[k] * d[k] + h01 * ys[k + 1] + h11 * h[k] * d[k + 1];
  }
}

/**
 * Hermite spline curve generator matching flightvid/data.py:hermite
 */
export function hermite(p0, p1, h0, h1, n) {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
  const L = Math.hypot(dx, dy);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1);
    const s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1;
    const h10 = s3 - 2 * s2 + s;
    const h01 = -2 * s3 + 3 * s2;
    const h11 = s3 - s2;
    const px = h00 * p0[0] + h10 * h0[0] * L + h01 * p1[0] + h11 * h1[0] * L;
    const py = h00 * p0[1] + h10 * h0[1] * L + h01 * p1[1] + h11 * h1[1] * L;
    pts.push([px, py]);
  }
  return pts;
}

/**
 * Piecewise leg builder matching flightvid/data.py:build
 */
export function buildLegs(legs) {
  let pts = [legs[0][0]];
  let tt = [0.0];
  let dd = [0.0];
  for (const [p0, p1, h0, h1, v] of legs) {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    const L = Math.hypot(dx, dy);
    const n = Math.max(2, Math.floor((L * 1000) / (v * 4)) + 1);
    let seg;
    if (h1 !== null) {
      seg = hermite(p0, p1, h0, h1, n);
    } else {
      seg = [];
      for (let i = 0; i < n; i++) {
        const frac = i / (n - 1);
        seg.push([p0[0] + dx * frac, p0[1] + dy * frac]);
      }
    }
    for (let i = 1; i < seg.length; i++) {
      const prev = seg[i - 1], cur = seg[i];
      const step = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
      pts.push(cur);
      dd.push(dd[dd.length - 1] + step);
      tt.push(tt[tt.length - 1] + (step * 1000) / v);
    }
  }
  return { pts, tt, dd };
}

export class FlightEngine {
  constructor(airport) {
    this.airport = airport;
    this.flights = [];
    this.events = [];
    this.hourlyHistogram = new Array(24).fill(0);
    this.totalArrivals = 0;
    this.totalDepartures = 0;
    this.domesticArrivals = 0;
    this.domesticDepartures = 0;
    this.intlArrivals = 0;
    this.intlDepartures = 0;
    this.isRealData = false;
    this.dataSourceName = "";
  }

  /**
   * Loads precomputed real flight data from JSON if available for airport
   */
  async loadPrecomputed(code = this.airport.code) {
    const mapKey = code.toLowerCase();
    const url = `/studio/data/${mapKey}-2026-10-17.json`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.loadFromJson(data);
      this.isRealData = true;
      this.dataSourceName = `ADS-B Fulpati (${data.airport.date || "2026-10-17"})`;
      return true;
    } catch (e) {
      console.warn(`No precomputed real flight data for ${code}, falling back to runway dynamics`, e);
      this.generateFromRunwayDynamics();
      this.isRealData = false;
      this.dataSourceName = "Runway Dynamics Engine";
      return false;
    }
  }

  /**
   * Ingests parsed JSON object
   */
  loadFromJson(data) {
    this.flights = [];
    this.events = data.events || [];
    this.hourlyHistogram = new Array(24).fill(0);
    this.totalArrivals = 0;
    this.totalDepartures = 0;
    this.domesticArrivals = 0;
    this.domesticDepartures = 0;
    this.intlArrivals = 0;
    this.intlDepartures = 0;

    for (const ev of this.events) {
      if (ev.kind === "arr") {
        this.totalArrivals++;
        if (ev.dom) this.domesticArrivals++;
        else this.intlArrivals++;
      } else {
        this.totalDepartures++;
        if (ev.dom) this.domesticDepartures++;
        else this.intlDepartures++;
      }
    }

    for (let i = 0; i < data.tracks.length; i++) {
      const tr = data.tracks[i];
      const pts = tr.pts.map(p => ({
        t: p[0],
        lat: p[1],
        lon: p[2],
        alt: p[3]
      }));

      if (pts.length < 2) continue;

      const startTime = tr.start || pts[0].t;
      const endTime = tr.end || pts[pts.length - 1].t;
      const hour = Math.floor((startTime % 86400) / 3600);
      if (hour >= 0 && hour < 24) this.hourlyHistogram[hour]++;

      this.flights.push({
        id: `FL-${tr.fid || (1000 + i)}`,
        fid: tr.fid || i,
        callsign: tr.reg || (tr.dom ? `DOM-${tr.fid}` : `INTL-${tr.fid}`),
        reg: tr.reg || "",
        type: tr.type || "",
        isDomestic: tr.dom,
        isArrival: pts[pts.length - 1].alt <= pts[0].alt,
        startTime,
        endTime,
        points: pts
      });
    }

    this.flights.sort((a, b) => a.startTime - b.startTime);
    return this.flights;
  }

  /**
   * Ingests and processes raw ADS-B CSV text directly on client
   * Columns: hex, t, lat, lon, alt, trk, reg, type
   */
  parseCsv(csvText) {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return [];

    const header = lines[0].split(",").map(c => c.trim().toLowerCase());
    const idxHex = header.indexOf("hex");
    const idxT = header.indexOf("t");
    const idxLat = header.indexOf("lat");
    const idxLon = header.indexOf("lon");
    const idxAlt = header.indexOf("alt");
    const idxReg = header.indexOf("reg");
    const idxType = header.indexOf("type");

    if (idxHex < 0 || idxT < 0 || idxLat < 0 || idxLon < 0 || idxAlt < 0) {
      throw new Error("CSV must contain columns: hex, t, lat, lon, alt");
    }

    const HELI = new Set([
      "A109", "A119", "A139", "A149", "A169", "A189", "AS32", "AS50", "AS55", "AS65", "B06", "B407", "B412",
      "B427", "B429", "B505", "EC20", "EC25", "EC30", "EC35", "EC45", "EC55", "EC75", "H125", "H135", "H145",
      "H160", "H500", "MI8", "MI17", "MI26", "R22", "R44", "R66", "S76", "S92", "UH1", "B212", "B222", "B230"
    ]);

    const centerLat = this.airport.lat;
    const centerLon = this.airport.lon;
    const nearKm = 60.0;

    const kmDist = (lat, lon) => Math.hypot((lat - centerLat) * 110.6, (lon - centerLon) * 98.2);

    // Parse rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(",");
      const altStr = parts[idxAlt]?.trim();
      if (!altStr || altStr === "" || isNaN(altStr)) continue;

      const hex = parts[idxHex]?.trim();
      const t = parseFloat(parts[idxT]);
      const lat = parseFloat(parts[idxLat]);
      const lon = parseFloat(parts[idxLon]);
      const alt = parseFloat(altStr);
      const reg = idxReg >= 0 ? parts[idxReg]?.trim() : "";
      const type = idxType >= 0 ? parts[idxType]?.trim() : "";

      if (HELI.has(type)) continue;

      rows.push({ hex, t, lat, lon, alt, reg, type });
    }

    // Sort by hex, t
    rows.sort((a, b) => (a.hex === b.hex ? a.t - b.t : a.hex.localeCompare(b.hex)));

    // Group into flights
    const flightsMap = [];
    let curFlight = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (curFlight.length === 0) {
        curFlight.push(r);
      } else {
        const prev = curFlight[curFlight.length - 1];
        if (prev.hex !== r.hex || r.t - prev.t > 600) {
          flightsMap.push(curFlight);
          curFlight = [r];
        } else {
          curFlight.push(r);
        }
      }
    }
    if (curFlight.length > 0) flightsMap.push(curFlight);

    // Filter overflights and interpolate
    const validTracks = [];
    const events = [];
    const t0 = rows.length > 0 ? rows[0].t : 0;

    for (let fid = 0; fid < flightsMap.length; fid++) {
      const f = flightsMap[fid];
      if (f.length < 3) continue;

      // Check if near airport
      let minDist = 999999;
      for (const pt of f) {
        const d = kmDist(pt.lat, pt.lon);
        if (d < minDist) minDist = d;
      }
      if (minDist > nearKm) continue;

      // Deduplicate timestamps
      const uniqueF = [];
      const seenT = new Set();
      for (const pt of f) {
        if (!seenT.has(pt.t)) {
          seenT.add(pt.t);
          uniqueF.push(pt);
        }
      }
      if (uniqueF.length < 3) continue;

      const isDom = (uniqueF[0].reg.startsWith("9N") || !uniqueF[0].reg) && !uniqueF[0].type.match(/^(A3|A2|B7|B3)/);

      // Split if gap > 300s
      let chunk = [uniqueF[0]];
      for (let j = 1; j < uniqueF.length; j++) {
        if (uniqueF[j].t - uniqueF[j - 1].t > 300) {
          if (chunk.length >= 3) {
            this._processTrackChunk(chunk, isDom, fid, t0, validTracks);
          }
          chunk = [uniqueF[j]];
        } else {
          chunk.push(uniqueF[j]);
        }
      }
      if (chunk.length >= 3) {
        this._processTrackChunk(chunk, isDom, fid, t0, validTracks);
      }
    }

    const dataObj = {
      airport: {
        code: this.airport.code,
        name: this.airport.name,
        date: "Uploaded CSV"
      },
      events,
      tracks: validTracks
    };

    this.loadFromJson(dataObj);
    this.isRealData = true;
    this.dataSourceName = `Custom ADS-B (${validTracks.length} tracks)`;
    return this.flights;
  }

  _processTrackChunk(chunk, isDom, fid, t0, validTracks) {
    const ts = chunk.map(p => p.t);
    const lats = chunk.map(p => p.lat);
    const lons = chunk.map(p => p.lon);
    const alts = chunk.map(p => p.alt);

    const pchipLat = new PchipInterpolator(ts, lats);
    const pchipLon = new PchipInterpolator(ts, lons);

    const step = 4;
    const pts = [];
    const tStart = ts[0];
    const tEnd = ts[ts.length - 1];

    for (let t = tStart; t <= tEnd; t += step) {
      // Linear interp for alt
      let low = 0, high = ts.length - 1;
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (ts[mid] <= t) low = mid + 1;
        else high = mid - 1;
      }
      const k = Math.max(0, Math.min(ts.length - 2, high));
      const frac = (t - ts[k]) / (ts[k + 1] - ts[k]);
      const altVal = alts[k] + frac * (alts[k + 1] - alts[k]);

      pts.push([
        Math.round((t - t0) * 10) / 10,
        Math.round(pchipLat.eval(t) * 100000) / 100000,
        Math.round(pchipLon.eval(t) * 100000) / 100000,
        Math.round(altVal)
      ]);
    }

    validTracks.push({
      fid,
      dom: isDom,
      reg: chunk[0].reg,
      type: chunk[0].type,
      start: pts[0][0],
      end: pts[pts.length - 1][0],
      pts
    });
  }

  /**
   * Generates procedural trajectories using realistic runway dynamics and Hermite splines
   */
  generateFromRunwayDynamics(flightCount = 240) {
    this.flights = [];
    this.events = [];
    this.hourlyHistogram = new Array(24).fill(0);
    this.totalArrivals = 0;
    this.totalDepartures = 0;
    this.domesticArrivals = 0;
    this.domesticDepartures = 0;
    this.intlArrivals = 0;
    this.intlDepartures = 0;

    const rwy = this.airport.runways[0];
    const headingRad = (rwy.heading * Math.PI) / 180;
    const ux = Math.sin(headingRad);
    const uy = Math.cos(headingRad);

    const centerLat = this.airport.lat;
    const centerLon = this.airport.lon;
    const fieldFt = this.airport.elevation_ft;
    const span = this.airport.span_lon;

    for (let i = 0; i < flightCount; i++) {
      // Realistic diurnal flight distribution: morning peak (7-10) and evening peak (14-19)
      const u = Math.random();
      let hour;
      if (u < 0.42) {
        hour = Math.floor(7 + Math.random() * 4);
      } else if (u < 0.82) {
        hour = Math.floor(13 + Math.random() * 6);
      } else {
        hour = Math.floor(Math.random() * 24);
      }
      this.hourlyHistogram[hour]++;

      const secondOfDay = hour * 3600 + Math.floor(Math.random() * 3600);
      const isArrival = Math.random() > 0.48;
      const isDomestic = Math.random() > 0.38;

      if (isArrival) {
        this.totalArrivals++;
        if (isDomestic) this.domesticArrivals++;
        else this.intlArrivals++;
      } else {
        this.totalDepartures++;
        if (isDomestic) this.domesticDepartures++;
        else this.intlDepartures++;
      }

      // Generate waypoints with Hermite approach/departure geometry
      const maxDistKm = span * 50; // TMA radius ~ 25-50 km
      const corridorAngle = isDomestic
        ? headingRad + (Math.random() - 0.5) * 1.6
        : headingRad + Math.PI + (Math.random() - 0.5) * 1.2;

      // Outer point P (km east, km north)
      const pDist = maxDistKm * (0.6 + Math.random() * 0.4);
      const px = Math.sin(corridorAngle) * pDist;
      const py = Math.cos(corridorAngle) * pDist;

      // Runway threshold & touchdown
      const tdX = ux * 0.3;
      const tdY = uy * 0.3;
      const fafX = -ux * 9.0;
      const fafY = -uy * 9.0;

      let legs;
      let cruiseAlt = isDomestic ? 12000 + Math.random() * 4000 : 22000 + Math.random() * 8000;

      if (isArrival) {
        // P -> FAF -> TD -> Rollout
        const h0 = [-Math.sin(corridorAngle), -Math.cos(corridorAngle)];
        const uVec = [ux, uy];
        legs = [
          [[px, py], [fafX, fafY], h0, uVec, 85],
          [[fafX, fafY], [tdX, tdY], uVec, null, 68],
          [[tdX, tdY], [tdX + ux * 1.2, tdY + uy * 1.2], uVec, null, 35]
        ];
      } else {
        // Rollout -> Liftoff -> Q
        const sX = -ux * 1.5, sY = -uy * 1.5;
        const loX = sX + ux * 1.9, loY = sY + uy * 1.9;
        const uVec = [ux, uy];
        const hq = [Math.sin(corridorAngle), Math.cos(corridorAngle)];
        legs = [
          [[sX, sY], [loX, loY], uVec, null, 50],
          [[loX, loY], [px, py], uVec, hq, 85]
        ];
      }

      const { pts: kmPts, tt, dd } = buildLegs(legs);
      const totalDur = tt[tt.length - 1];
      const startT = isArrival ? secondOfDay - totalDur : secondOfDay;
      const endT = isArrival ? secondOfDay : secondOfDay + totalDur;

      const flightPts = [];
      const totalKm = dd[dd.length - 1];

      for (let k = 0; k < kmPts.length; k++) {
        const ptT = startT + tt[k];
        const ptLat = centerLat + kmPts[k][1] / 110.6;
        const ptLon = centerLon + kmPts[k][0] / 98.2;

        let ptAlt;
        if (isArrival) {
          const frac = dd[k] / totalKm;
          ptAlt = fieldFt + Math.pow(1 - frac, 1.4) * (cruiseAlt - fieldFt);
        } else {
          const frac = dd[k] / totalKm;
          ptAlt = fieldFt + Math.pow(frac, 1.3) * (cruiseAlt - fieldFt);
        }

        flightPts.push({
          t: ptT,
          lat: ptLat,
          lon: ptLon,
          alt: ptAlt
        });
      }

      this.events.push({
        t: secondOfDay,
        kind: isArrival ? "arr" : "dep",
        dom: isDomestic
      });

      this.flights.push({
        id: `FL-${1000 + i}`,
        fid: i,
        callsign: isDomestic ? `DOM-${100 + (i % 899)}` : `INTL-${200 + (i % 799)}`,
        reg: isDomestic ? `9N-A${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 3) % 26))}` : "",
        type: isDomestic ? "AT76" : "A320",
        isDomestic,
        isArrival,
        startTime: startT,
        endTime: endT,
        points: flightPts
      });
    }

    this.flights.sort((a, b) => a.startTime - b.startTime);
    this.events.sort((a, b) => a.t - b.t);
    return this.flights;
  }

  /**
   * Returns active aircraft currently in the air at given secondOfDay (0..86400)
   */
  getActiveAircraft(currentTimeSec) {
    const active = [];
    for (const f of this.flights) {
      if (currentTimeSec >= f.startTime && currentTimeSec <= f.endTime) {
        const pts = f.points;
        let low = 0, high = pts.length - 1;
        while (low <= high) {
          const mid = (low + high) >> 1;
          if (pts[mid].t <= currentTimeSec) low = mid + 1;
          else high = mid - 1;
        }
        const idx = Math.max(0, Math.min(pts.length - 2, high));
        const p1 = pts[idx];
        const p2 = pts[idx + 1];
        const dt = p2.t - p1.t || 1;
        const frac = Math.min(Math.max((currentTimeSec - p1.t) / dt, 0), 1);

        const lat = p1.lat + (p2.lat - p1.lat) * frac;
        const lon = p1.lon + (p2.lon - p1.lon) * frac;
        const alt = p1.alt + (p2.alt - p1.alt) * frac;

        // Heading angle (tangent)
        const dLat = (p2.lat - p1.lat) * 110.6;
        const dLon = (p2.lon - p1.lon) * 98.2;
        const headingRad = Math.atan2(dLon, dLat);

        active.push({
          id: f.id,
          callsign: f.callsign,
          isDomestic: f.isDomestic,
          isArrival: f.isArrival,
          lat,
          lon,
          alt,
          headingRad
        });
      }
    }
    return active;
  }

  /**
   * Returns live event counts up to currentTimeSec
   */
  getStatsAtTime(currentTimeSec) {
    let arrDom = 0, arrIntl = 0, depDom = 0, depIntl = 0;
    for (const ev of this.events) {
      if (ev.t <= currentTimeSec) {
        if (ev.kind === "arr") {
          if (ev.dom) arrDom++;
          else arrIntl++;
        } else {
          if (ev.dom) depDom++;
          else depIntl++;
        }
      }
    }
    return {
      arrDom,
      arrIntl,
      depDom,
      depIntl,
      totalArr: arrDom + arrIntl,
      totalDep: depDom + depIntl
    };
  }
}
