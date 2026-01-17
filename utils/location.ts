
import { latLngToCell, gridDisk, cellToBoundary } from 'h3-js';

export const H3_RESOLUTION = 7; // ~1.2km width hexagons

export const getH3Index = (lat: number, lng: number): string => {
  return latLngToCell(lat, lng, H3_RESOLUTION);
};

export const getNeighbors = (h3Index: string): string[] => {
  return gridDisk(h3Index, 1);
};

export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GEOLOCATION_NOT_SUPPORTED"));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 8000, // 8 seconds
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => {
        let errorMsg = "UNKNOWN_LOCATION_ERROR";
        if (err.code === err.PERMISSION_DENIED) errorMsg = "PERMISSION_DENIED";
        if (err.code === err.POSITION_UNAVAILABLE) errorMsg = "POSITION_UNAVAILABLE";
        if (err.code === err.TIMEOUT) errorMsg = "TIMEOUT";
        reject(new Error(errorMsg));
      },
      options
    );
  });
};

export const formatH3 = (index: string) => {
  if (!index) return '...';
  return index.substring(0, 8).toUpperCase();
};

export const getCellBoundary = (h3Index: string) => {
  return cellToBoundary(h3Index);
};
