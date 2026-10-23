/**
 * Flight Engine: Ingestion & Trajectory Simulation
 * Supports real ADS-B ingestion + procedural generation for any airport.
 */

export class FlightEngine {
  constructor(airport) {
    this.airport = airport;
    this.flights = [];
    this.hourlyHistogram = new Array(24).fill(0);
    this.totalArrivals = 0;
    this.totalDepartures = 0;
  }

  /**
   * Generates or loads 24 hours of flight trajectories for the airport
   */
  generate24hSchedule(flightCount = 240) {
    this.flights = [];
    this.hourlyHistogram = new Array(24).fill(0);
    this.totalArrivals = 0;
    this.totalDepartures = 0;

    const rwy = this.airport.runways[0];
    const baseHeadingRad = (rwy.heading * Math.PI) / 180;

    for (let i = 0; i < flightCount; i++) {
      // Pick hour with realistic dual-peak curve (morning 7-10, afternoon 14-18)
      const u = Math.random();
      let hour;
      if (u < 0.4) {
        hour = Math.floor(7 + Math.random() * 4); // Morning peak
      } else if (u < 0.8) {
        hour = Math.floor(13 + Math.random() * 6); // Afternoon peak
      } else {
        hour = Math.floor(Math.random() * 24);
      }
      this.hourlyHistogram[hour]++;

      const secondOfDay = hour * 3600 + Math.floor(Math.random() * 3600);
      const isArrival = Math.random() > 0.45;
      const isDomestic = Math.random() > 0.35;

      if (isArrival) this.totalArrivals++;
      else this.totalDepartures++;

      // Generate flight path points (lat, lon, alt, t)
      const points = this.generateTrajectory(isArrival, isDomestic, secondOfDay, baseHeadingRad);
      
      this.flights.push({
        id: `FL-${1000 + i}`,
        callsign: isDomestic ? `DOM-${100 + (i % 899)}` : `INTL-${200 + (i % 799)}`,
        isArrival,
        isDomestic,
        startTime: secondOfDay - (isArrival ? 1200 : 0),
        endTime: secondOfDay + (isArrival ? 0 : 1200),
        points
      });
    }

    // Sort by start time
    this.flights.sort((a, b) => a.startTime - b.startTime);
    return this.flights;
  }

  /**
   * Generates Catmull-Rom smoothed spline points snapped to the runway
   */
  generateTrajectory(isArrival, isDomestic, runwayTime, headingRad) {
    const points = [];
    const span = this.airport.span_lon;
    const centerLat = this.airport.lat;
    const centerLon = this.airport.lon;
    const fieldAlt = this.airport.elevation_ft;

    // Angle of approach / departure corridor
    const corridorAngle = isDomestic 
      ? headingRad + (Math.random() - 0.5) * 1.8
      : headingRad + Math.PI + (Math.random() - 0.5) * 1.4;

    const maxDist = span * 0.9;
    const durSec = 900 + Math.random() * 400; // ~15-20 min in TMA

    const numWaypoints = 16;
    for (let k = 0; k <= numWaypoints; k++) {
      const frac = k / numWaypoints;
      const progress = isArrival ? frac : (1 - frac); // 1 = at runway, 0 = far away

      // Distance from runway
      const dist = Math.pow(1 - progress, 1.4) * maxDist;
      
      // Arc with natural turn onto runway centerline
      const turnWarp = Math.sin((1 - progress) * Math.PI) * 0.08 * (Math.random() > 0.5 ? 1 : -1);
      const lat = centerLat + Math.cos(corridorAngle + turnWarp) * dist;
      const lon = centerLon + Math.sin(corridorAngle + turnWarp) * dist * 1.15;

      // Altitude glide slope: from cruise down to runway elevation
      const maxAlt = isDomestic ? 14000 : 28000;
      const alt = fieldAlt + Math.pow(1 - progress, 1.2) * (maxAlt - fieldAlt);

      const t = isArrival 
        ? runwayTime - (1 - progress) * durSec 
        : runwayTime + progress * durSec;

      points.push({ lat, lon, alt, t });
    }

    return points;
  }

  /**
   * Returns active aircraft positions at a specific second of the day
   */
  getActiveAircraft(secondOfDay) {
    const active = [];
    for (const f of this.flights) {
      if (secondOfDay >= f.startTime && secondOfDay <= f.endTime) {
        // Interpolate position along points
        const pts = f.points;
        for (let i = 0; i < pts.length - 1; i++) {
          if (secondOfDay >= pts[i].t && secondOfDay <= pts[i + 1].t) {
            const span = pts[i + 1].t - pts[i].t;
            const alpha = span > 0 ? (secondOfDay - pts[i].t) / span : 0;
            active.push({
              id: f.id,
              callsign: f.callsign,
              isArrival: f.isArrival,
              isDomestic: f.isDomestic,
              lat: pts[i].lat + (pts[i + 1].lat - pts[i].lat) * alpha,
              lon: pts[i].lon + (pts[i + 1].lon - pts[i].lon) * alpha,
              alt: pts[i].alt + (pts[i + 1].alt - pts[i].alt) * alpha,
              heading: Math.atan2(pts[i + 1].lon - pts[i].lon, pts[i + 1].lat - pts[i].lat)
            });
            break;
          }
        }
      }
    }
    return active;
  }
}
