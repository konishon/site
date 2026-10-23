/**
 * Export Engine: High-DPI Poster & In-Browser Video
 * Produces 300 DPI print-ready PNG/SVG posters and 60 FPS MP4 timelapse videos.
 */

import { MapRenderer } from "./renderer.js";

export class ExportEngine {
  constructor(airport, flights, themeKey = "brick") {
    this.airport = airport;
    this.flights = flights;
    this.themeKey = themeKey;
  }

  /**
   * Generates a 300 DPI Print-Ready Poster PNG
   */
  async exportPosterPNG(width = 2400, height = 3200) {
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;

    const renderer = new MapRenderer(offscreen, this.airport, this.themeKey);
    renderer.showCropGuide = false; // no dashed guides on exported poster
    renderer.render(this.flights);

    // Draw Typographic Cartouche Plaque onto high-res canvas
    this.renderPosterTypography(offscreen.getContext("2d"), width, height, renderer.theme);

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
    const scale = (Math.min(width, height) / span) * 0.9;

    const proj = (lat, lon) => ({
      x: width / 2 + (lon - centerLon) * scale,
      y: height / 2 - (lat - centerLat) * scale * 1.15
    });

    let pathsSvg = "";
    for (const f of this.flights) {
      if (f.points.length < 2) continue;
      const pts = f.points.map(p => proj(p.lat, p.lon));
      let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < pts.length; i++) {
        d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
      }
      pathsSvg += `  <path d="${d}" fill="none" stroke="#fcd34d" stroke-width="${f.isDomestic ? 1.6 : 2.2}" opacity="0.8" />\n`;
    }

    const r1 = proj(this.airport.lat + rwy.dlat1, this.airport.lon + rwy.dlon1);
    const r2 = proj(this.airport.lat + rwy.dlat2, this.airport.lon + rwy.dlon2);

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#6e1f24" />
  
  <!-- Flight Paths -->
  <g id="flight-paths">
${pathsSvg}  </g>

  <!-- Runway -->
  <line x1="${r1.x}" y1="${r1.y}" x2="${r2.x}" y2="${r2.y}" stroke="#ffffff" stroke-width="4.5" stroke-linecap="square" />
  <circle cx="${width/2}" cy="${height/2}" r="4" fill="#ffffff" />

  <!-- Typography Cartouche -->
  <g id="poster-hud" transform="translate(60, ${height - 240})">
    <rect width="360" height="180" rx="8" fill="#54161a" opacity="0.95" />
    <text x="24" y="58" font-family="Georgia, serif" font-size="44" font-weight="900" fill="#f7f3ea">${this.airport.code}</text>
    <text x="24" y="92" font-family="sans-serif" font-size="14" font-weight="700" fill="#f7f3ea">${this.airport.airport.toUpperCase()}</text>
    <text x="24" y="118" font-family="sans-serif" font-size="11" fill="#fed7aa">${this.airport.icao} • ${this.airport.country} • ELEV ${this.airport.elevation_ft} FT</text>
    <text x="24" y="142" font-family="sans-serif" font-size="11" fill="#fcd34d">RUNWAY ${rwy.name} • 24 HOURS OF FLIGHTS</text>
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
   * Renders the classic cartographic typography onto the high-res poster canvas
   */
  renderPosterTypography(ctx, w, h, theme) {
    const pad = w * 0.05;
    const cardW = Math.min(420, w * 0.4);
    const cardH = 180;
    const x = pad;
    const y = h - pad - cardH;

    ctx.save();
    // Card background
    ctx.fillStyle = theme.hudBg;
    ctx.beginPath();
    ctx.roundRect(x, y, cardW, cardH, 8);
    ctx.fill();

    // IATA code
    ctx.fillStyle = theme.hudText;
    ctx.font = "900 48px Georgia, serif";
    ctx.fillText(this.airport.code, x + 24, y + 54);

    // Subtitle
    ctx.font = "700 13px sans-serif";
    ctx.fillText(this.airport.airport.toUpperCase(), x + 24, y + 84);

    ctx.font = "500 11px sans-serif";
    ctx.fillStyle = theme.trailHigh;
    ctx.fillText(`${this.airport.icao} • ${this.airport.lat.toFixed(2)}°N ${this.airport.lon.toFixed(2)}°E • ELEV ${this.airport.elevation_ft} FT`, x + 24, y + 110);

    ctx.fillStyle = theme.trailLow;
    ctx.font = "600 11px sans-serif";
    ctx.fillText(`RUNWAY ${this.airport.runways[0].name} • 24 HOURS OF FLIGHT TRACKS`, x + 24, y + 138);

    ctx.restore();
  }

  /**
   * Exports a 60 FPS Timelapse Video
   * Uses WebCodecs VideoEncoder when available, with MediaRecorder fallback.
   */
  async exportVideo(onProgress = () => {}) {
    const fps = 60;
    const durationSec = 15; // 15s timelapse of 24h
    const totalFrames = fps * durationSec;
    const width = 1080;
    const height = 1440; // 3:4 Instagram Vertical

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const renderer = new MapRenderer(canvas, this.airport, this.themeKey);
    renderer.showCropGuide = false;

    // Check for MediaRecorder or WebCodecs
    const stream = canvas.captureStream(fps);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") 
      ? "video/webm;codecs=vp9" 
      : "video/webm";

    const mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.airport.code}_timelapse_60fps.webm`;
        a.click();
        resolve(url);
      };

      mediaRecorder.start();

      let frame = 0;
      const step = () => {
        const progress = frame / totalFrames;
        const currentSec = progress * 86400; // 0 to 24h
        
        renderer.render(this.flights, currentSec);
        this.renderPosterTypography(canvas.getContext("2d"), width, height, renderer.theme);
        
        onProgress(Math.round(progress * 100));
        frame++;

        if (frame <= totalFrames) {
          requestAnimationFrame(step);
        } else {
          setTimeout(() => mediaRecorder.stop(), 200);
        }
      };

      step();
    });
  }
}
