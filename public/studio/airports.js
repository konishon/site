/**
 * Global Airport Database for AeroStudio
 * Includes major commercial & regional hub coordinates, elevation, and runway vectors.
 */

export const AIRPORTS = [
  {
    code: "KTM",
    icao: "VNKT",
    name: "Kathmandu",
    airport: "Tribhuvan International Airport",
    country: "Nepal",
    lat: 27.6966,
    lon: 85.3591,
    elevation_ft: 4390,
    elevation_m: 1338,
    runways: [
      { name: "02/20", heading: 19, length_m: 3350, dlat1: -0.0143, dlon1: -0.0056, dlat2: 0.0143, dlon2: 0.0056 }
    ],
    default_zoom: 11,
    span_lon: 0.45
  },
  {
    code: "PKR",
    icao: "VNPK",
    name: "Pokhara",
    airport: "Pokhara International Airport",
    country: "Nepal",
    lat: 28.1889,
    lon: 83.9856,
    elevation_ft: 2690,
    elevation_m: 820,
    runways: [
      { name: "12/30", heading: 115, length_m: 2500, dlat1: 0.0048, dlon1: -0.0102, dlat2: -0.0048, dlon2: 0.0102 }
    ],
    default_zoom: 11.5,
    span_lon: 0.35
  },
  {
    code: "JFK",
    icao: "KJFK",
    name: "New York",
    airport: "John F. Kennedy International Airport",
    country: "United States",
    lat: 40.6413,
    lon: -73.7781,
    elevation_ft: 13,
    elevation_m: 4,
    runways: [
      { name: "04L/22R", heading: 44, length_m: 3682, dlat1: -0.012, dlon1: -0.012, dlat2: 0.012, dlon2: 0.012 },
      { name: "13R/31L", heading: 134, length_m: 4423, dlat1: 0.014, dlon1: -0.014, dlat2: -0.014, dlon2: 0.014 }
    ],
    default_zoom: 10.5,
    span_lon: 0.65
  },
  {
    code: "LHR",
    icao: "EGLL",
    name: "London",
    airport: "Heathrow Airport",
    country: "United Kingdom",
    lat: 51.4700,
    lon: -0.4543,
    elevation_ft: 83,
    elevation_m: 25,
    runways: [
      { name: "09L/27R", heading: 90, length_m: 3902, dlat1: 0.0, dlon1: -0.024, dlat2: 0.0, dlon2: 0.024 },
      { name: "09R/27L", heading: 90, length_m: 3660, dlat1: -0.006, dlon1: -0.022, dlat2: -0.006, dlon2: 0.022 }
    ],
    default_zoom: 10.5,
    span_lon: 0.60
  },
  {
    code: "HND",
    icao: "RJTT",
    name: "Tokyo",
    airport: "Tokyo Haneda Airport",
    country: "Japan",
    lat: 35.5494,
    lon: 139.7798,
    elevation_ft: 35,
    elevation_m: 11,
    runways: [
      { name: "16R/34L", heading: 156, length_m: 3000, dlat1: 0.012, dlon1: -0.005, dlat2: -0.012, dlon2: 0.005 },
      { name: "05/23", heading: 47, length_m: 2500, dlat1: -0.008, dlon1: -0.009, dlat2: 0.008, dlon2: 0.009 }
    ],
    default_zoom: 11,
    span_lon: 0.55
  },
  {
    code: "DXB",
    icao: "OMDB",
    name: "Dubai",
    airport: "Dubai International Airport",
    country: "United Arab Emirates",
    lat: 25.2532,
    lon: 55.3657,
    elevation_ft: 62,
    elevation_m: 19,
    runways: [
      { name: "12L/30R", heading: 121, length_m: 4000, dlat1: 0.009, dlon1: -0.016, dlat2: -0.009, dlon2: 0.016 },
      { name: "12R/30L", heading: 121, length_m: 4450, dlat1: 0.006, dlon1: -0.018, dlat2: -0.006, dlon2: 0.018 }
    ],
    default_zoom: 11,
    span_lon: 0.50
  },
  {
    code: "SIN",
    icao: "WSSS",
    name: "Singapore",
    airport: "Singapore Changi Airport",
    country: "Singapore",
    lat: 1.3644,
    lon: 103.9915,
    elevation_ft: 22,
    elevation_m: 7,
    runways: [
      { name: "02L/20R", heading: 23, length_m: 4000, dlat1: -0.016, dlon1: -0.007, dlat2: 0.016, dlon2: 0.007 },
      { name: "02C/20C", heading: 23, length_m: 4000, dlat1: -0.016, dlon1: -0.001, dlat2: 0.016, dlon2: 0.001 }
    ],
    default_zoom: 11,
    span_lon: 0.50
  },
  {
    code: "ZRH",
    icao: "LSZH",
    name: "Zurich",
    airport: "Zurich Airport",
    country: "Switzerland",
    lat: 47.4582,
    lon: 8.5555,
    elevation_ft: 1416,
    elevation_m: 432,
    runways: [
      { name: "16/34", heading: 156, length_m: 3700, dlat1: 0.015, dlon1: -0.007, dlat2: -0.015, dlon2: 0.007 }
    ],
    default_zoom: 11,
    span_lon: 0.45
  }
];

export function findAirport(query) {
  if (!query) return AIRPORTS[0];
  const q = query.trim().toUpperCase();
  const match = AIRPORTS.find(a => 
    a.code === q || 
    a.icao === q || 
    a.name.toUpperCase().includes(q) || 
    a.airport.toUpperCase().includes(q)
  );
  return match || AIRPORTS[0];
}
