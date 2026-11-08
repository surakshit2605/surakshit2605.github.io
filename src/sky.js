/**
 * Live sky over Mauritius. Everything is computed in the browser from the date and the place (no network, no tracking):
 *  - the Sun's height and direction, today's sunrise, sunset and day length (NOAA solar-position method)
 *  - whether the Southern Cross is above the horizon right now
 * Place: Port Louis, 20.16°S 57.50°E. Mauritius is UTC+4 all year.
 */
export const PLACE = { lat: -20.1609, lon: 57.5012 };
const MU_OFFSET_H = 4;
const rad = Math.PI / 180, deg = 180 / Math.PI;

const julian = (ms) => ms / 86400000 + 2440587.5;

/** Sun for a moment in time: { alt, az } in degrees (az from north, clockwise). */
export function sunAt(ms, lat = PLACE.lat, lon = PLACE.lon) {
  const jd = julian(ms), T = (jd - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(M * rad) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * rad) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * rad) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * rad);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * rad);
  const decl = Math.asin(Math.sin(eps * rad) * Math.sin(lambda * rad)) * deg;
  const y = Math.tan((eps / 2) * rad) ** 2;
  const eqTime = 4 * deg * (y * Math.sin(2 * L0 * rad) - 2 * e * Math.sin(M * rad) + 4 * e * y * Math.sin(M * rad) * Math.cos(2 * L0 * rad) - 0.5 * y * y * Math.sin(4 * L0 * rad) - 1.25 * e * e * Math.sin(2 * M * rad)); // minutes
  const d = new Date(ms);
  const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
  const trueSolarMin = (utcMin + eqTime + 4 * lon + 1440) % 1440;
  const ha = trueSolarMin / 4 < 0 ? trueSolarMin / 4 + 180 : trueSolarMin / 4 - 180;
  const cosZ = Math.sin(lat * rad) * Math.sin(decl * rad) + Math.cos(lat * rad) * Math.cos(decl * rad) * Math.cos(ha * rad);
  const zen = Math.acos(Math.min(1, Math.max(-1, cosZ))) * deg;
  const az = (Math.atan2(Math.sin(ha * rad), Math.cos(ha * rad) * Math.sin(lat * rad) - Math.tan(decl * rad) * Math.cos(lat * rad)) * deg + 180) % 360;
  return { alt: 90 - zen, az, decl, eqTime };
}

/** Sunrise/sunset on the local (UTC+4) calendar day of `ms`: minutes after local midnight, or null in polar day/night. */
export function sunTimes(ms, lat = PLACE.lat, lon = PLACE.lon) {
  const local = new Date(ms + MU_OFFSET_H * 3600000);
  const dayStartUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - MU_OFFSET_H * 3600000;
  // Solar noon from the equation of time at local noon, then the hour angle for the horizon (-0.833°: refraction + sun's radius).
  const noon = sunAt(dayStartUtc + 12 * 3600000, lat, lon);
  const cosH = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(noon.decl * rad)) / (Math.cos(lat * rad) * Math.cos(noon.decl * rad));
  if (cosH > 1 || cosH < -1) return null;
  const H = Math.acos(cosH) * deg; // degrees
  const solarNoonUtcMin = 720 - 4 * lon - noon.eqTime;
  const rise = solarNoonUtcMin - 4 * H + MU_OFFSET_H * 60, set = solarNoonUtcMin + 4 * H + MU_OFFSET_H * 60;
  return { rise, set, length: set - rise };
}

/* Southern Cross and its pointers (J2000 positions, degrees). */
export const CRUX = {
  stars: [
    { id: 'acrux', name: 'Acrux', ra: 186.6496, dec: -63.0991 },
    { id: 'gacrux', name: 'Gacrux', ra: 187.7915, dec: -57.1132 },
    { id: 'mimosa', name: 'Mimosa', ra: 191.9303, dec: -59.6888 },
    { id: 'imai', name: 'Imai', ra: 183.7863, dec: -58.7489 },
  ],
  pointers: [
    { id: 'hadar', name: 'Hadar', ra: 210.9559, dec: -60.3730 },
    { id: 'rigil', name: 'Rigil Kentaurus', ra: 219.8961, dec: -60.8340 },
  ],
};

/** Altitude (degrees) of a star at a moment in time. */
export function starAlt(ra, dec, ms, lat = PLACE.lat, lon = PLACE.lon) {
  const jd = julian(ms), d = jd - 2451545;
  const gmst = (280.46061837 + 360.98564736629 * d) % 360; // degrees
  const lst = (gmst + lon + 720) % 360;
  const ha = (lst - ra) * rad;
  const s = Math.sin(lat * rad) * Math.sin(dec * rad) + Math.cos(lat * rad) * Math.cos(dec * rad) * Math.cos(ha);
  return Math.asin(Math.min(1, Math.max(-1, s))) * deg;
}

export const fmtHM = (min) => `${String(Math.floor(((min % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(Math.floor(((min % 60) + 60) % 60)).padStart(2, '0')}`;
export const fmtLen = (min) => `${Math.floor(min / 60)}h ${String(Math.round(min % 60)).padStart(2, '0')}m`;
