/**
 * Cartographic Canvas Renderer
 * Python reference: flightvid/core.py and flightvid/layers.py
 * Author: Nishon Tandukar (konishon)
 */

export const THEMES = {
  brick: {
    key: "brick",
    name: "Dashain Brick",
    bg: "#8b342e",          // warm brick page
    contour: "rgba(30, 20, 20, 0.4)",
    runway: "#1e1414",
    runwayMarking: "#f2efe8",
    hudBg: "#8b342e",
    hudText: "#f2efe8",
    hudSub: "#d6d0c6",
    cardEdge: "#1e1414",
    accent: "#fcb000",
    plane: "#f2efe8",
    stops: {
      dom: [[0, [196, 180, 168]], [0.5, [228, 220, 210]], [1, [255, 252, 246]]], // paper white
      intl: [[0, [200, 128, 0]], [0.5, [252, 176, 0]], [1, [255, 214, 80]]]      // saffron
    }
  },
  orange: {
    key: "orange",
    name: "Dashain Marigold",
    bg: "#db8240",          // marigold hills
    contour: "rgba(92, 30, 38, 0.25)",
    runway: "#5c1e26",      // wine runway
    runwayMarking: "#f7e9c2",
    hudBg: "#5c1e26",
    hudText: "#f7e9c2",
    hudSub: "#dec4a0",
    cardEdge: "#5c1e26",
    accent: "#f7e9c2",
    plane: "#3a141e",
    stops: {
      dom: [[0, [96, 18, 36]], [0.5, [160, 24, 44]], [1, [214, 36, 78]]],
      intl: [[0, [122, 44, 122]], [0.5, [56, 58, 134]], [1, [18, 30, 84]]]
    }
  },
  radar: {
    key: "radar",
    name: "Midnight Radar",
    bg: "#060911",
    contour: "rgba(30, 41, 59, 0.5)",
    runway: "#00f0ff",
    runwayMarking: "#ffffff",
    hudBg: "#0d1322",
    hudText: "#00f0ff",
    hudSub: "#94a3b8",
    cardEdge: "#1e293b",
    accent: "#38bdf8",
    plane: "#ffffff",
    stops: {
      dom: [[0, [0, 240, 255]], [0.5, [56, 189, 248]], [1, [129, 140, 248]]],
      intl: [[0, [244, 63, 94]], [0.5, [251, 146, 60]], [1, [250, 204, 21]]]
    }
  },
  swiss: {
    key: "swiss",
    name: "Swiss Minimal",
    bg: "#f8f7f4",
    contour: "rgba(0, 0, 0, 0.08)",
    runway: "#0f172a",
    runwayMarking: "#ffffff",
    hudBg: "#0f172a",
    hudText: "#ffffff",
    hudSub: "#94a3b8",
    cardEdge: "#cbd5e1",
    accent: "#dc2626",
    plane: "#0f172a",
    stops: {
      dom: [[0, [220, 38, 38]], [0.5, [185, 28, 28]], [1, [153, 27, 27]]],
      intl: [[0, [15, 23, 42]], [0.5, [51, 65, 85]], [1, [100, 116, 139]]]
    }
  }
};

export class MapRenderer {
  constructor(canvas, airport, themeKey = "brick") {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.airport = airport;
    this.theme = THEMES[themeKey] || THEMES.brick;
    this.showCropGuide = false;
    this.showPosterHUD = true;
  }

  setTheme(themeKey) {
    if (THEMES[themeKey]) this.theme = THEMES[themeKey];
  }

  setAirport(airport) {
    this.airport = airport;
  }

  /**
   * Exact equirectangular/Mercator projection from flightvid/core.py:Ctx
   */
  project(lat, lon, w, h) {
    const latC = this.airport.lat;
    const lonC = this.airport.lon;
    const spanLon = this.airport.span_lon || 0.45;

    const kx = w / spanLon;
    const ky = kx / Math.cos((latC * Math.PI) / 180);

    const x = (lon - lonC) * kx + w / 2;
    const y = h / 2 - (lat - latC) * ky;
    return { x, y };
  }

  /**
   * Exact altitude color interpolation matching flightvid/core.py:colors
   */
  getColor(alt, isDomestic) {
    const fieldFt = this.airport.elevation_ft;
    const f = Math.pow(Math.min(Math.max((alt - fieldFt) / 22000, 0), 1), 0.85);

    const palKey = isDomestic ? "dom" : "intl";
    const stops = this.theme.stops[palKey];

    // Linear interpolate between stops
    let lowStop = stops[0];
    let highStop = stops[stops.length - 1];

    for (let i = 0; i < stops.length - 1; i++) {
      if (f >= stops[i][0] && f <= stops[i + 1][0]) {
        lowStop = stops[i];
        highStop = stops[i + 1];
        break;
      }
    }

    const span = highStop[0] - lowStop[0] || 1;
    const t = (f - lowStop[0]) / span;

    const r = Math.round(lowStop[1][0] + (highStop[1][0] - lowStop[1][0]) * t);
    const g = Math.round(lowStop[1][1] + (highStop[1][1] - lowStop[1][1]) * t);
    const b = Math.round(lowStop[1][2] + (highStop[1][2] - lowStop[1][2]) * t);

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Main rendering loop
   */
  render(flights, currentTimeSec = null, activeAircraft = []) {
    const { ctx, canvas, theme } = this;
    const w = canvas.width;
    const h = canvas.height;

    // 1. Background Fill
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);

    // 2. Cartographic Grid & Range Rings
    this.drawRangeRings(w, h);

    // 3. Runway Lines
    this.drawRunways(w, h);

    // 4. Flight Trajectory Trails
    this.drawTrails(flights, w, h, currentTimeSec);

    // 5. Active Aircraft Silhouettes
    if (activeAircraft && activeAircraft.length > 0) {
      this.drawAircraft(activeAircraft, w, h);
    }

    // 6. Poster Cartouche Typography (if enabled)
    if (this.showPosterHUD) {
      this.drawPosterCartouche(w, h, flights);
    }

    // 7. Crop Guides (3:4 Instagram / Poster safe frame)
    if (this.showCropGuide) {
      this.drawCropGuide(w, h);
    }
  }

  drawRangeRings(w, h) {
    const { ctx, theme } = this;
    const center = this.project(this.airport.lat, this.airport.lon, w, h);

    ctx.save();
    ctx.strokeStyle = theme.contour;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);

    // Draw rings at 10 km, 20 km, 30 km, 40 km
    const kmPx = (w / (this.airport.span_lon * 98.2));
    for (const km of [10, 20, 30, 40, 50]) {
      const r = km * kmPx;
      ctx.beginPath();
      ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
      ctx.stroke();

      // Ring label
      ctx.font = "9px -apple-system, sans-serif";
      ctx.fillStyle = theme.contour;
      ctx.fillText(`${km} km`, center.x + r + 4, center.y + 3);
    }
    ctx.restore();
  }

  drawRunways(w, h) {
    const { ctx, theme } = this;
    const runways = this.airport.runways || [];

    ctx.save();
    for (const rwy of runways) {
      const p1 = this.project(this.airport.lat + rwy.dlat1, this.airport.lon + rwy.dlon1, w, h);
      const p2 = this.project(this.airport.lat + rwy.dlat2, this.airport.lon + rwy.dlon2, w, h);

      // Runway base line
      ctx.strokeStyle = theme.runway;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Centerline
      ctx.strokeStyle = theme.runwayMarking;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Threshold ticks
      const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const perp = ang + Math.PI / 2;
      const tw = 6;
      ctx.beginPath();
      ctx.moveTo(p1.x + Math.cos(perp) * tw, p1.y + Math.sin(perp) * tw);
      ctx.lineTo(p1.x - Math.cos(perp) * tw, p1.y - Math.sin(perp) * tw);
      ctx.moveTo(p2.x + Math.cos(perp) * tw, p2.y + Math.sin(perp) * tw);
      ctx.lineTo(p2.x - Math.cos(perp) * tw, p2.y - Math.sin(perp) * tw);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawTrails(flights, w, h, currentTimeSec) {
    const { ctx } = this;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const isSimMode = currentTimeSec !== null;

    for (const f of flights) {
      if (isSimMode && f.startTime > currentTimeSec) continue;

      const pts = f.points;
      if (pts.length < 2) continue;

      let maxIdx = pts.length - 1;
      if (isSimMode && f.endTime > currentTimeSec) {
        // Find current point index
        let low = 0, high = pts.length - 1;
        while (low <= high) {
          const mid = (low + high) >> 1;
          if (pts[mid].t <= currentTimeSec) low = mid + 1;
          else high = mid - 1;
        }
        maxIdx = Math.max(1, high);
      }

      ctx.lineWidth = f.isDomestic ? 1.8 : 2.4;

      for (let i = 0; i < maxIdx; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];

        const s1 = this.project(p1.lat, p1.lon, w, h);
        const s2 = this.project(p2.lat, p2.lon, w, h);

        // Clip outside viewport
        if ((s1.x < -100 && s2.x < -100) || (s1.x > w + 100 && s2.x > w + 100) ||
            (s1.y < -100 && s2.y < -100) || (s1.y > h + 100 && s2.y > h + 100)) {
          continue;
        }

        ctx.strokeStyle = this.getColor(p2.alt, f.isDomestic);
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawAircraft(activeAircraft, w, h) {
    const { ctx, theme } = this;
    ctx.save();

    for (const ac of activeAircraft) {
      const pos = this.project(ac.lat, ac.lon, w, h);

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(ac.headingRad);

      // Airplane silhouette matching flightvid/layers.py:make_icon
      ctx.fillStyle = theme.plane;
      ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;

      ctx.beginPath();
      // Fuselage
      ctx.ellipse(0, 0, 2.5, 9, 0, 0, Math.PI * 2);
      // Wings
      ctx.moveTo(-9, 1);
      ctx.lineTo(9, 1);
      ctx.lineTo(3, -2);
      ctx.lineTo(-3, -2);
      ctx.closePath();
      // Tailplane
      ctx.moveTo(-5, 7);
      ctx.lineTo(5, 7);
      ctx.lineTo(2, 5);
      ctx.lineTo(-2, 5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Poster typography & dual altitude legend bars
   * Python reference: flightvid/layers.py:poster
   */
  drawPosterCartouche(w, h, flights) {
    const { ctx, theme, airport } = this;
    const cardW = Math.min(420, w - 48);
    const cardH = 175;
    const x0 = 24;
    const y0 = h - cardH - 24;

    ctx.save();
    // Glassmorphic / clean container
    ctx.fillStyle = theme.hudBg;
    ctx.strokeStyle = theme.cardEdge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x0, y0, cardW, cardH, 10);
    ctx.fill();
    ctx.stroke();

    // Tracked IATA Serif
    ctx.font = "900 38px Georgia, 'Times New Roman', serif";
    ctx.fillStyle = theme.hudText;
    ctx.fillText(airport.code, x0 + 18, y0 + 44);

    // Metadata Right Column
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.fillStyle = theme.accent;
    ctx.textAlign = "right";
    ctx.fillText(`${airport.icao} \u2022 ${airport.country}`, x0 + cardW - 18, y0 + 26);

    ctx.font = "10px -apple-system, sans-serif";
    ctx.fillStyle = theme.hudSub;
    ctx.fillText(`${airport.lat.toFixed(2)}\u00b0N ${airport.lon.toFixed(2)}\u00b0E`, x0 + cardW - 18, y0 + 42);

    // Airport Name
    ctx.textAlign = "left";
    ctx.font = "700 12px -apple-system, sans-serif";
    ctx.fillStyle = theme.hudText;
    ctx.fillText(airport.airport.toUpperCase(), x0 + 18, y0 + 64);

    // Count flights
    let domCount = 0, intlCount = 0;
    for (const f of flights) {
      if (f.isDomestic) domCount++;
      else intlCount++;
    }

    // Dual Altitude Legends matching Python poster
    const rampX = x0 + 18;
    const rampW = cardW - 36;
    const rampH = 8;

    // Row 1: Domestic
    ctx.font = "700 10px -apple-system, sans-serif";
    ctx.fillStyle = theme.hudSub;
    ctx.fillText("DOMESTIC TRAJECTORIES", rampX, y0 + 86);
    ctx.textAlign = "right";
    ctx.fillText(`${domCount} flights`, rampX + rampW, y0 + 86);

    ctx.textAlign = "left";
    const gradDom = ctx.createLinearGradient(rampX, 0, rampX + rampW, 0);
    const stopsDom = theme.stops.dom;
    for (const s of stopsDom) {
      gradDom.addColorStop(s[0], `rgb(${s[1].join(",")})`);
    }
    ctx.fillStyle = gradDom;
    ctx.beginPath();
    ctx.roundRect(rampX, y0 + 92, rampW, rampH, 3);
    ctx.fill();

    // Row 2: International
    ctx.font = "700 10px -apple-system, sans-serif";
    ctx.fillStyle = theme.hudSub;
    ctx.fillText("INTERNATIONAL TRAJECTORIES", rampX, y0 + 118);
    ctx.textAlign = "right";
    ctx.fillText(`${intlCount} flights`, rampX + rampW, y0 + 118);

    ctx.textAlign = "left";
    const gradIntl = ctx.createLinearGradient(rampX, 0, rampX + rampW, 0);
    const stopsIntl = theme.stops.intl;
    for (const s of stopsIntl) {
      gradIntl.addColorStop(s[0], `rgb(${s[1].join(",")})`);
    }
    ctx.fillStyle = gradIntl;
    ctx.beginPath();
    ctx.roundRect(rampX, y0 + 124, rampW, rampH, 3);
    ctx.fill();

    // Altitude tick marks
    ctx.font = "9px -apple-system, sans-serif";
    ctx.fillStyle = theme.hudSub;
    ctx.textAlign = "left";
    ctx.fillText("4k ft", rampX, y0 + 146);
    ctx.textAlign = "center";
    ctx.fillText("15k ft", rampX + rampW / 2, y0 + 146);
    ctx.textAlign = "right";
    ctx.fillText("26k ft", rampX + rampW, y0 + 146);

    ctx.restore();
  }

  drawCropGuide(w, h) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = "rgba(220, 38, 38, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);

    // 3:4 aspect ratio bounds
    let cropW = w;
    let cropH = (w * 4) / 3;
    if (cropH > h) {
      cropH = h;
      cropW = (h * 3) / 4;
    }
    const cx = (w - cropW) / 2;
    const cy = (h - cropH) / 2;

    ctx.strokeRect(cx, cy, cropW, cropH);

    ctx.font = "10px -apple-system, sans-serif";
    ctx.fillStyle = "rgba(220, 38, 38, 0.6)";
    ctx.fillText("3:4 Print Frame", cx + 8, cy + 16);
    ctx.restore();
  }
}
