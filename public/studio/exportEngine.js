/**
 * Export Engine: High-DPI Poster & In-Browser Video Timelapse
 * Author: Nishon Tandukar (konishon)
 */

import { MapRenderer } from "./renderer.js";

export class ExportEngine {
  constructor(airport, flights, themeKey = "brick", flightEngine = null) {
    this.airport = airport;
    this.flights = flights;
    this.themeKey = themeKey;
    this.flightEngine = flightEngine;
  }

  /**
   * Generates a 300 DPI Print-Ready Poster PNG (2400 x 3200)
   */
  async exportPosterPNG(width = 2400, height = 3200) {
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;

    const renderer = new MapRenderer(offscreen, this.airport, this.themeKey);
    renderer.showCropGuide = false;
    renderer.showPosterHUD = true;
    renderer.render(this.flights);

    return new Promise((resolve) => {
      offscreen.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.airport.code}_flight_poster_300dpi.png`;
        a.click();
        resolve(url);
      }, "image/png");
    });
  }

  /**
   * Generates a scalable vector SVG poster
   */
  exportPosterSVG(width = 1200, height = 1600) {
    const rwy = this.airport.runways[0];
    const span = this.airport.span_lon;
    const centerLat = this.airport.lat;
    const centerLon = this.airport.lon;

    const kx = width / span;
    const ky = kx / Math.cos((centerLat * Math.PI) / 180);

    const proj = (lat, lon) => ({
      x: (lon - centerLon) * kx + width / 2,
      y: height / 2 - (lat - centerLat) * ky
    });

    let pathsSvg = "";
    for (const f of this.flights) {
      if (f.points.length < 2) continue;
      const pts = f.points.map(p => proj(p.lat, p.lon));
      let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < pts.length; i++) {
        d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
      }
      const strokeColor = f.isDomestic ? "#fcd34d" : "#f59e0b";
      pathsSvg += `  <path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${f.isDomestic ? 1.6 : 2.2}" opacity="0.85" />\n`;
    }

    const r1 = proj(this.airport.lat + rwy.dlat1, this.airport.lon + rwy.dlon1);
    const r2 = proj(this.airport.lat + rwy.dlat2, this.airport.lon + rwy.dlon2);

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#8b342e" />
  
  <!-- Flight Paths -->
  <g id="flight-paths">
${pathsSvg}  </g>

  <!-- Runway -->
  <line x1="${r1.x.toFixed(1)}" y1="${r1.y.toFixed(1)}" x2="${r2.x.toFixed(1)}" y2="${r2.y.toFixed(1)}" stroke="#1e1414" stroke-width="6" />
  <line x1="${r1.x.toFixed(1)}" y1="${r1.y.toFixed(1)}" x2="${r2.x.toFixed(1)}" y2="${r2.y.toFixed(1)}" stroke="#f2efe8" stroke-width="2" />

  <!-- Poster Cartouche -->
  <g id="poster-hud" transform="translate(40, ${height - 240})">
    <rect width="420" height="190" rx="10" fill="#8b342e" stroke="#1e1414" stroke-width="1.5" />
    <text x="24" y="58" font-family="Georgia, serif" font-size="44" font-weight="900" fill="#f2efe8">${this.airport.code}</text>
    <text x="24" y="90" font-family="sans-serif" font-size="13" font-weight="700" fill="#f2efe8">${this.airport.airport.toUpperCase()}</text>
    <text x="24" y="112" font-family="sans-serif" font-size="11" fill="#d6d0c6">${this.airport.icao} \u2022 ${this.airport.country} \u2022 ${this.airport.lat.toFixed(2)}\u00b0N ${this.airport.lon.toFixed(2)}\u00b0E</text>
    <text x="24" y="136" font-family="sans-serif" font-size="11" font-weight="700" fill="#fcb000">RUNWAY ${rwy.name} \u2022 ELEV ${this.airport.elevation_ft} FT</text>
  </g>
</svg>`;

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${this.airport.code}_flight_poster.svg`;
    a.click();
    return url;
  }

  /**
   * Generates a 60 FPS Video Timelapse using Canvas captureStream + MediaRecorder
   */
  async exportTimelapseVideo(durationSec = 20, onProgress = () => {}) {
    const width = 1080;
    const height = 1440;
    const fps = 60;
    const totalFrames = durationSec * fps;

    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;

    const renderer = new MapRenderer(offscreen, this.airport, this.themeKey);
    renderer.showCropGuide = false;
    renderer.showPosterHUD = true;

    // Use MediaRecorder
    const stream = offscreen.captureStream(fps);
    let mimeType = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm";
    }

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 10_000_000
    });

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const completionPromise = new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.airport.code}_flight_timelapse_60fps.webm`;
        a.click();
        resolve(url);
      };
      recorder.onerror = reject;
    });

    recorder.start();

    // Render frame by frame from t=0 to 86400
    for (let frame = 0; frame < totalFrames; frame++) {
      const progress = frame / totalFrames;
      const currentSecond = progress * 86400;

      const activeAircraft = this.flightEngine
        ? this.flightEngine.getActiveAircraft(currentSecond)
        : [];

      renderer.render(this.flights, currentSecond, activeAircraft);

      // Draw Time & Date HUD Overlay in top corner
      const ctx = offscreen.getContext("2d");
      const localSec = (currentSecond + (this.airport.utc_offset_s || 0)) % 86400;
      const h24 = Math.floor(localSec / 3600);
      const h12 = h24 % 12 || 12;
      const m = Math.floor((localSec % 3600) / 60);
      const ampm = h24 < 12 ? "AM" : "PM";
      const timeStr = `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;

      ctx.save();
      ctx.font = "900 24px -apple-system, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 6;
      ctx.fillText(timeStr, 40, 60);
      ctx.font = "600 13px -apple-system, sans-serif";
      ctx.fillStyle = renderer.theme.accent;
      ctx.fillText(`24h Simulation \u2022 60 FPS`, 40, 84);
      ctx.restore();

      onProgress(Math.round(progress * 100));

      // Yield frame
      await new Promise(r => setTimeout(r, 1000 / fps));
    }

    recorder.stop();
    return completionPromise;
  }
}
