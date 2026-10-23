/**
 * Global Airport Database for AeroStudio
 * Ground-truth aeronautical parameters aligned with maps/ktm.py, maps/pkr.py and ICAO specifications.
 * Author: Nishon Tandukar (konishon)
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
    utc_offset_s: 5.75 * 3600,
    span_lon: 0.45,
    hasRealDataset: true,
    runways: [
      { name: "02/20", heading: 19, length_m: 3350, dlat1: -0.0143, dlon1: -0.0056, dlat2: 0.0143, dlon2: 0.0056 }
    ]
  },
  {
    code: "PKR",
    icao: "VNPR",
    name: "Pokhara",
    airport: "Pokhara International Airport",
    country: "Nepal",
    lat: 28.1841,
    lon: 84.0141,
    elevation_ft: 2637,
    elevation_m: 804,
    utc_offset_s: 5.75 * 3600,
    span_lon: 0.60,
    hasRealDataset: true,
    runways: [
      { name: "12/30", heading: 296, length_m: 2500, dlat1: 0.0045, dlon1: -0.0107, dlat2: -0.0045, dlon2: 0.0107 }
    ]
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
    utc_offset_s: -4 * 3600,
    span_lon: 0.65,
    hasRealDataset: false,
    runways: [
      { name: "04L/22R", heading: 44, length_m: 3682, dlat1: -0.012, dlon1: -0.012, dlat2: 0.012, dlon2: 0.012 },
      { name: "13R/31L", heading: 134, length_m: 4423, dlat1: 0.014, dlon1: -0.014, dlat2: -0.014, dlon2: 0.014 }
    ]
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
    utc_offset_s: 0,
    span_lon: 0.60,
    hasRealDataset: false,
    runways: [
      { name: "09L/27R", heading: 90, length_m: 3902, dlat1: 0.0, dlon1: -0.024, dlat2: 0.0, dlon2: 0.024 },
      { name: "09R/27L", heading: 90, length_m: 3660, dlat1: -0.006, dlon1: -0.022, dlat2: -0.006, dlon2: 0.022 }
    ]
  },
  {
    code: "HND",
    icao: "RJTT",
    name: "Tokyo",
    airport: "Tokyo Haneda Airport",
    country: "Japan",
    lat: 35.5494,
    lon: 139.7798,
    elevation_ft: 21,
    elevation_m: 6,
    utc_offset_s: 9 * 3600,
    span_lon: 0.55,
    hasRealDataset: false,
    runways: [
      { name: "16L/34R", heading: 160, length_m: 3360, dlat1: 0.014, dlon1: -0.006, dlat2: -0.014, dlon2: 0.006 },
      { name: "05/23", heading: 50, length_m: 2500, dlat1: -0.008, dlon1: -0.010, dlat2: 0.008, dlon2: 0.010 }
    ]
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
    utc_offset_s: 4 * 3600,
    span_lon: 0.50,
    hasRealDataset: false,
    runways: [
      { name: "12L/30R", heading: 120, length_m: 4450, dlat1: 0.010, dlon1: -0.020, dlat2: -0.010, dlon2: 0.020 }
    ]
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
    utc_offset_s: 8 * 3600,
    span_lon: 0.50,
    hasRealDataset: false,
    runways: [
      { name: "02L/20R", heading: 23, length_m: 4000, dlat1: -0.016, dlon1: -0.007, dlat2: 0.016, dlon2: 0.007 }
    ]
  }
];

export function findAirport(codeOrIcao) {
  const q = codeOrIcao.trim().toUpperCase();
  return AIRPORTS.find(a => a.code === q || a.icao === q) || AIRPORTS[0];
}
