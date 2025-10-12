/**
 * Mosque Type Definition
 * 
 * Represents a mosque location with geographic coordinates and metadata.
 * Designed to be extensible for future features like:
 * - Prayer times
 * - Opening hours
 * - Denomination/affiliation
 * - Contact information
 * - Amenities (parking, women's section, etc.)
 */

export interface Mosque {
  name: string;
  address: string;
  postcode: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export interface MosqueWithDistance extends Mosque {
  distance?: number;
}

