"use client";

import { useEffect, useState } from 'react';

export type UserLocation = {
  lat: number;
  lng: number;
};

const cachedLocationKey = 'comerciospy:user-location:v1';

export function hasUsableCoordinates(value?: { lat?: number; lng?: number } | null) {
  return (
    Boolean(value) &&
    Number.isFinite(value?.lat) &&
    Number.isFinite(value?.lng) &&
    value?.lat !== undefined &&
    value?.lng !== undefined &&
    !(value.lat === 0 && value.lng === 0)
  );
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceKm(from?: UserLocation | null, to?: { lat?: number; lng?: number } | null) {
  if (!from || !hasUsableCoordinates(to) || to?.lat === undefined || to.lng === undefined) return null;

  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function formatDistanceKm(distanceKm?: number | null) {
  if (distanceKm === null || distanceKm === undefined || !Number.isFinite(distanceKm)) return '';

  if (distanceKm < 1) {
    return `${Math.max(50, Math.round((distanceKm * 1000) / 50) * 50)} m`;
  }

  return `${new Intl.NumberFormat('es-PY', {
    maximumFractionDigits: distanceKm < 10 ? 1 : 0,
    minimumFractionDigits: distanceKm < 10 ? 1 : 0
  }).format(distanceKm)} km`;
}

function readCachedLocation() {
  if (typeof window === 'undefined') return null;

  try {
    const rawValue = window.sessionStorage.getItem(cachedLocationKey);
    const parsed = rawValue ? (JSON.parse(rawValue) as UserLocation) : null;
    return hasUsableCoordinates(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function cacheLocation(location: UserLocation) {
  try {
    window.sessionStorage.setItem(cachedLocationKey, JSON.stringify(location));
  } catch {
    // Location still works for the current render if storage is blocked.
  }
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    const cachedLocation = readCachedLocation();
    if (cachedLocation) {
      setLocation(cachedLocation);
      return;
    }

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        if (!hasUsableCoordinates(nextLocation)) return;
        setLocation(nextLocation);
        cacheLocation(nextLocation);
      },
      () => undefined,
      {
        enableHighAccuracy: false,
        maximumAge: 1000 * 60 * 10,
        timeout: 5000
      }
    );
  }, []);

  return location;
}
