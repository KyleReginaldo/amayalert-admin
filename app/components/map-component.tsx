'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Map, MapControls, MapMarker, MarkerContent, useMap } from '@/components/ui/map';
import { MapPin, Search } from 'lucide-react';
import type { MapMouseEvent } from 'maplibre-gl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const defaultCenter = {
  lat: 14.5995,
  lng: 120.9842,
};

const defaultZoom = 13;

interface MapComponentProps {
  initialLocation?: { lat: number; lng: number; address?: string };
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  height?: string;
  className?: string;
}

type SearchResult = {
  id: number | string;
  display_name: string;
  lat: number;
  lng: number;
};

function MapClickHandler({
  onSelect,
}: {
  onSelect: (coords: { lat: number; lng: number }) => void;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const handler = (event: MapMouseEvent) => {
      onSelect({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    };

    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [map, isLoaded, onSelect]);

  return null;
}

function MapCenterController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    map.easeTo({ center, zoom, duration: 500 });
  }, [map, isLoaded, center, zoom]);

  return null;
}

const MapComponent = ({
  initialLocation,
  onLocationSelect,
  height = '400px',
  className = '',
}: MapComponentProps) => {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(
    initialLocation
      ? {
          lat: initialLocation.lat,
          lng: initialLocation.lng,
          address:
            initialLocation.address ||
            `${initialLocation.lat.toFixed(6)}, ${initialLocation.lng.toFixed(6)}`,
        }
      : null,
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialLocation
      ? [initialLocation.lng, initialLocation.lat]
      : [defaultCenter.lng, defaultCenter.lat],
  );
  const [searchValue, setSearchValue] = useState(initialLocation?.address || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const suppressSearchRef = useRef(false);

  const mapZoom = selectedLocation ? 15 : defaultZoom;

  const applyLocation = useCallback(
    (location: { lat: number; lng: number; address: string }) => {
      suppressSearchRef.current = true;
      setSelectedLocation(location);
      setMapCenter([location.lng, location.lat]);
      setSearchValue(location.address);
      onLocationSelect?.(location);
    },
    [onLocationSelect],
  );

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (!response.ok) {
        throw new Error('Reverse geocode failed');
      }
      const result = await response.json();
      return result?.data?.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  const handleMapSelect = useCallback(
    async ({ lat, lng }: { lat: number; lng: number }) => {
      const address = await reverseGeocode(lat, lng);
      applyLocation({ lat, lng, address });
      setSearchResults([]);
    },
    [applyLocation, reverseGeocode],
  );

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setGeoError(null);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const address = await reverseGeocode(lat, lng);
        applyLocation({ lat, lng, address });
      },
      (error) => {
        console.error('Error getting current location:', error);
        setGeoError('Failed to get current location. Please check permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [applyLocation, reverseGeocode]);

  const ranAutoLocate = useRef(false);
  useEffect(() => {
    if (ranAutoLocate.current) return;
    if (initialLocation) return;
    ranAutoLocate.current = true;
    getCurrentLocation();
  }, [getCurrentLocation, initialLocation]);

  useEffect(() => {
    if (suppressSearchRef.current) {
      suppressSearchRef.current = false;
      return;
    }

    const trimmed = searchValue.trim();
    if (!trimmed || trimmed.length < 3) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError(null);
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Search failed');
        const result = await response.json();
        if (!result?.success) throw new Error(result?.error || 'Search failed');
        setSearchResults(result.data || []);
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        console.error('Search error:', error);
        setSearchError('Failed to search locations.');
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchValue]);

  const handleSelectResult = useCallback(
    (result: SearchResult) => {
      applyLocation({ lat: result.lat, lng: result.lng, address: result.display_name });
      setSearchResults([]);
    },
    [applyLocation],
  );

  const searchList = useMemo(() => {
    if (!searchValue.trim() || searchValue.trim().length < 3) return null;

    return (
      <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-md border bg-white shadow-lg">
        {searchLoading && <div className="px-3 py-2 text-xs text-slate-500">Searching...</div>}
        {searchError && <div className="px-3 py-2 text-xs text-red-600">{searchError}</div>}
        {!searchLoading && !searchError && searchResults.length === 0 && (
          <div className="px-3 py-2 text-xs text-slate-500">No matches found.</div>
        )}
        {!searchLoading &&
          !searchError &&
          searchResults.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => handleSelectResult(result)}
              className="flex w-full items-start gap-2 border-b px-3 py-2 text-left text-sm hover:bg-slate-50 last:border-b-0"
            >
              <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
              <span className="text-slate-700">{result.display_name}</span>
            </button>
          ))}
      </div>
    );
  }, [handleSelectResult, searchError, searchLoading, searchResults, searchValue]);

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <div className="space-y-2">
        <div className="flex gap-4">
          <Label htmlFor="location-search">Search Location</Label>
          <Button
            size="sm"
            type="button"
            variant="default"
            onClick={getCurrentLocation}
            className="shrink-0"
          >
            <MapPin className="mr-1 h-3 w-3" />
            <span className="text-[12px]">Use Current</span>
          </Button>
        </div>
        {geoError && (
          <div className="mt-1 text-xs text-red-600">
            {geoError}
            <button
              type="button"
              onClick={() => {
                setGeoError(null);
                getCurrentLocation();
              }}
              className="ml-2 text-red-700 underline"
            >
              Retry
            </button>
          </div>
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="location-search"
            placeholder="Search for a place..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && searchResults.length > 0) {
                event.preventDefault();
                handleSelectResult(searchResults[0]);
              }
            }}
            autoComplete="off"
            className="pl-10"
          />
          {searchValue && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSearchValue('');
                setSearchResults([]);
              }}
            >
              ×
            </button>
          )}
          {searchList}
        </div>

        <p className="text-sm text-muted-foreground">
          Search for a location, choose a suggestion, or click on the map to select a point.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border" style={{ height }}>
        <Map center={mapCenter} zoom={mapZoom} theme="light">
          <MapCenterController center={mapCenter} zoom={mapZoom} />
          <MapClickHandler onSelect={handleMapSelect} />
          <MapControls position="bottom-right" showLocate={false} />
          {selectedLocation && (
            <MapMarker
              longitude={selectedLocation.lng}
              latitude={selectedLocation.lat}
              draggable
              onDragEnd={(lngLat) => handleMapSelect({ lat: lngLat.lat, lng: lngLat.lng })}
            >
              <MarkerContent>
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-10 w-10 rounded-full bg-red-500/20" />
                  <div className="absolute h-4 w-4 rounded-full bg-red-500" />
                </div>
              </MarkerContent>
            </MapMarker>
          )}
        </Map>
      </div>

      {selectedLocation && (
        <div className="text-sm text-muted-foreground">
          Selected coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
};

export { MapComponent };
