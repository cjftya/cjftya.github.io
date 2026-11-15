import { wrapTime } from './timeOfDay';

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

/** NOAA's approximate solar equations, evaluated in UTC (no timezone/DST offsets).
 * https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 * World axes: +X east, -Z north. No network is required for solar lighting.
 */
export function solarFrame(now: number, location: GeoLocation) {
  const date = new Date(now);
  const year = date.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const days = (Date.UTC(year + 1, 0, 1) - start) / 86400000;
  const day = Math.floor((now - start) / 86400000) + 1;
  const hour = (((now % 86400000) + 86400000) % 86400000) / 3600000;
  const g = ((2 * Math.PI) / days) * (day - 1 + (hour - 12) / 24);
  const eq =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);
  const lat = (location.latitude * Math.PI) / 180;
  const solarHour = wrapTime(hour + location.longitude / 15 + eq / 60);
  const ha = ((solarHour - 12) * Math.PI) / 12;
  const elevation = Math.asin(
    Math.min(
      1,
      Math.max(
        -1,
        Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(ha),
      ),
    ),
  );
  const azimuth =
    Math.atan2(
      Math.sin(ha),
      Math.cos(ha) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat),
    ) + Math.PI;
  const altitude = (elevation * 180) / Math.PI;
  const peak = Math.max(6, 90 - Math.abs(location.latitude - (decl * 180) / Math.PI));
  // Reuse the fantasy palette while moving dawn/dusk with the local solar altitude.
  const morning = solarHour < 12;
  const lightingHour =
    altitude >= 0
      ? morning
        ? 6 + (altitude / peak) * 6
        : 18 - (altitude / peak) * 6
      : morning
        ? Math.max(0, 6 + altitude / 4)
        : Math.min(24, 18 - altitude / 4);
  return {
    elevation: Math.sin(elevation),
    azimuth: azimuth - Math.PI / 2,
    lightingHour: wrapTime(lightingHour),
    altitude,
  };
}

export function localHour(now: number, formatter?: Intl.DateTimeFormat): number {
  if (!formatter) {
    const date = new Date(now);
    return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  }
  const parts = formatter.formatToParts(now);
  const value = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return wrapTime(value('hour') + value('minute') / 60 + value('second') / 3600);
}
