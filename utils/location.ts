
import * as h3 from 'h3-js';

export const H3_RESOLUTION = 7; // ~1.2km width hexagons

export const getH3Index = (lat: number, lng: number): string => {
  return h3.latLngToCell(lat, lng, H3_RESOLUTION);
};

export const getNeighbors = (h3Index: string): string[] => {
  return h3.gridDisk(h3Index, 1);
};

export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });
  });
};

export const formatH3 = (index: string) => {
  if (!index) return '...';
  return index.substring(0, 8).toUpperCase();
};

export const getCellBoundary = (h3Index: string) => {
  return h3.cellToBoundary(h3Index);
};
