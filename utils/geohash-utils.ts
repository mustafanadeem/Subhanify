const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encodeGeohash(latitude: number, longitude: number, precision: number = 7): string {
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const lonMid = (lonMin + lonMax) / 2;
      if (longitude > lonMid) {
        idx = (idx << 1) + 1;
        lonMin = lonMid;
      } else {
        idx = idx << 1;
        lonMax = lonMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (latitude > latMid) {
        idx = (idx << 1) + 1;
        latMin = latMid;
      } else {
        idx = idx << 1;
        latMax = latMid;
      }
    }
    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

export function decodeGeohash(geohash: string): { latitude: number; longitude: number; error: { latitude: number; longitude: number } } {
  let evenBit = true;
  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;

  for (let i = 0; i < geohash.length; i++) {
    const chr = geohash[i];
    const idx = BASE32.indexOf(chr);
    if (idx === -1) throw new Error('Invalid geohash');

    for (let n = 4; n >= 0; n--) {
      const bitN = (idx >> n) & 1;
      if (evenBit) {
        const lonMid = (lonMin + lonMax) / 2;
        if (bitN === 1) {
          lonMin = lonMid;
        } else {
          lonMax = lonMid;
        }
      } else {
        const latMid = (latMin + latMax) / 2;
        if (bitN === 1) {
          latMin = latMid;
        } else {
          latMax = latMid;
        }
      }
      evenBit = !evenBit;
    }
  }

  const latitude = (latMin + latMax) / 2;
  const longitude = (lonMin + lonMax) / 2;

  const latError = (latMax - latMin) / 2;
  const lonError = (lonMax - lonMin) / 2;

  return {
    latitude,
    longitude,
    error: { latitude: latError, longitude: lonError },
  };
}

export function getTileId(latitude: number, longitude: number, precision: number = 7): string {
  return encodeGeohash(latitude, longitude, precision);
}

export function areTilesEqual(tile1: string | null, tile2: string | null): boolean {
  if (!tile1 || !tile2) return false;
  return tile1 === tile2;
}

