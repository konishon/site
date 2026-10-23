/**
 * Cartographic Canvas Renderer
 * Renders basemap terrain, runways, flight tracks, and HUD plaques.
 * Pure function of viewport dimensions, airport data, and active time.
 */

export const THEMES = {
  brick: {
    name: "Dashain Brick",
    bg: "#6e1f24",
    contour: "rgba(247, 243, 234, 0.18)",
    road: "#f59e0b",
    runway: "#ffffff",
    trailLow: "#fcd34d",
    trailMid: "#f59e0b",
    trailHigh: "#fed7aa",
    hudBg: "#54161a",
    hudText: "#f7f3ea",
    cardBg: "#ffffff",
    cardText: "#0f172a"
  },
  radar: {
    name: "Midnight Radar",
    bg: "#060911",
    contour: "rgba(30, 41, 59, 0.45)",
    road: "#0284c7",
    runway: "#00f0ff",
    trailLow: "#00f0ff",
    trailMid: "#38bdf8",
    trailHigh: "#f43f5e",
    hudBg: "#0f172a",
    hudText: "#00f0ff",
    cardBg: "#0d1322",
    cardText: "#e2e8f0"
  },
  swiss: {
    name: "Swiss Minimal",
    bg: "#f8f7f4",
    contour: "rgba(0, 0, 0, 0.08)",
    road: "#cbd5e1",
    runway: "#0f172a",
    trailLow: "#dc2626",
    trailMid: "#1e293b",
    trailHigh: "#94a3b8",
    hudBg: "#0f172a",
    hudText: "#ffffff",
    cardBg: "#ffffff",
    cardText: "#0f172a"
  },
  blueprint: {
    name: "Technical Blueprint",
    bg: "#0d223a",
    contour: "rgba(56, 189, 248, 0.14)",
    road: "#0284c7",
    runway: "#ffffff",
    trailLow: "#38bdf8",
    trailMid: "#bae6fd",
    trailHigh: "#ffffff",
    hudBg: "#081526",
    hudText: "#38bdf8",
    cardBg: "#0a192f",
    cardText: "#f1f5f9"
  }
};

export class MapRenderer {
  constructor(canvas, airport, themeKey = "brick") {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.airport = airport;
    this.theme = THEMES[themeKey] || THEMES.brick;
    this.cropMode = "3:4"; // "3:4", "1:1", "A3", "16:9"
    this.showHud = true;
    this.showCropGuide = true;
  }

  setTheme(themeKey) {
    if (THEMES[themeKey]) this.theme = THEMES[themeKey];
  }

  setAirport(airport) {
    this.airport = airport;
  }

  project(lat, lon, width, height) {
    const span = this.airport.span_lon;
    const centerLat = this.airport.lat;
    const centerLon = this.airport.lon;

    const scale = (Math.min(width, height) / span) * 0.9;
    const x = width / 2 + (lon - centerLon) * scale;
    // Invert lat for canvas Y
    const y = height / 2 - (lat - centerLat) * scale * 1.15;
    return { x, y };
  }

  render(flights, currentTimeSec = null, activeAircraft = []) {
    const { ctx, canvas, theme } = this;
    const w = canvas.width;
    const h = canvas.height;

    // 1. Clear background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);

    // 2. Render terrain contour loops
    this.renderContours(w, h);

    // 3. Render runway
    this.renderRunway(w, h);

    // 4. Render flight tracks
    this.renderFlightTracks(flights, currentTimeSec, w, h);

    // 5. Render active aircraft radar blips
    if (activeAircraft && activeAircraft.length > 0) {
      this.renderAircraftBlips(activeAircraft, w, h);
    }

    // 6. Render poster crop boundaries (if enabled)
    if (this.showCropGuide) {
      this.renderCropOverlay(w, h);
    }
  }

  renderContours(w, h) {
    const { ctx, theme } = this;
    ctx.save();
    ctx.strokeStyle = theme.contour;
    ctx.lineWidth = 1.5;

    const rings = [0.75, 0.55, 0.38, 0.22];
    for (const r of rings) {
      ctx.beginPath();
      const numPts = 12;
      for (let i = 0; i <= numPts; i++) {
        const theta = (i / numPts) * Math.PI * 2;
        const warp = 1 + Math.sin(theta * 3) * 0.12 + Math.cos(theta * 2) * 0.08;
        const rx = (w / 2) * r * warp;
        const ry = (h / 2) * r * warp * 0.9;
        const px = w / 2 + Math.cos(theta) * rx;
        const py = h / 2 + Math.sin(theta) * ry;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  renderRunway(w, h) {
    const { ctx, theme, airport } = this;
    const rwy = airport.runways[0];
    const p1 = this.project(airport.lat + rwy.dlat1, airport.lon + rwy.dlon1, w, h);
    const p2 = this.project(airport.lat + rwy.dlat2, airport.lon + rwy.dlon2, w, h);

    ctx.save();
    // Runway line
    ctx.strokeStyle = theme.runway;
    ctx.lineWidth = 5;
    ctx.lineCap = "square";
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Center reference point
    const center = this.project(airport.lat, airport.lon, w, h);
    ctx.fillStyle = theme.runway;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderFlightTracks(flights, currentTimeSec, w, h) {
    const { ctx, theme } = this;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const f of flights) {
      const pts = f.points;
      if (pts.length < 2) continue;

      // Filter by time if animating
      let visiblePts = pts;
      if (currentTimeSec !== null) {
        if (f.startTime > currentTimeSec) continue;
        visiblePts = pts.filter(p => p.t <= currentTimeSec);
        if (visiblePts.length < 2) continue;
      }

      ctx.beginPath();
      const start = this.project(visiblePts[0].lat, visiblePts[0].lon, w, h);
      ctx.moveTo(start.x, start.y);

      for (let i = 1; i < visiblePts.length; i++) {
        const pt = this.project(visiblePts[i].lat, visiblePts[i].lon, w, h);
        ctx.lineTo(pt.x, pt.y);
      }

      // Altitude ramp styling
      const avgAlt = (visiblePts[0].alt + visiblePts[visiblePts.length - 1].alt) / 2;
      let strokeCol = theme.trailLow;
      if (avgAlt > 10000) strokeCol = theme.trailMid;
      if (avgAlt > 20000) strokeCol = theme.trailHigh;

      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = f.isDomestic ? 1.8 : 2.2;
      ctx.globalAlpha = currentTimeSec !== null ? 0.9 : 0.75;
      ctx.stroke();
    }

    ctx.restore();
  }

  renderAircraftBlips(aircraftList, w, h) {
    const { ctx, theme } = this;
    ctx.save();
    for (const a of aircraftList) {
      const pos = this.project(a.lat, a.lon, w, h);
      
      // Radar ping circle
      ctx.strokeStyle = theme.runway;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 9, 0, Math.PI * 2);
      ctx.stroke();

      // Solid aircraft dot
      ctx.fillStyle = theme.trailLow;
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderCropOverlay(w, h) {
    const { ctx } = this;
    let targetRatio = 3 / 4; // default
    if (this.cropMode === "1:1") targetRatio = 1;
    if (this.cropMode === "16:9") targetRatio = 16 / 9;
    if (this.cropMode === "A3") targetRatio = 1 / 1.414;

    const margin = 40;
    let cropW, cropH;
    if ((w - margin * 2) / (h - margin * 2) > targetRatio) {
      cropH = h - margin * 2;
      cropW = cropH * targetRatio;
    } else {
      cropW = w - margin * 2;
      cropH = cropW / targetRatio;
    }

    const x0 = (w - cropW) / 2;
    const y0 = (h - cropH) / 2;

    ctx.save();
    // Darken exterior
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.rect(x0, y0, cropW, cropH);
    ctx.fill("evenodd");

    // Crop border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x0, y0, cropW, cropH);
    ctx.restore();
  }
}
