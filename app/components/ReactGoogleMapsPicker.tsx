'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { AlertCircle, MapPin, Navigation, Search } from 'lucide-react';
import { useCallback, useState } from 'react';

interface ReactGoogleMapsPickerProps {
  initialLocation?: { lat: number; lng: number; address?: string };
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  height?: string;
  className?: string;
}

// Map's styling
const defaultMapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
};

// Default map center (Manila, Philippines)
const defaultMapCenter = {
  lat: 14.5995,
  lng: 120.9842,
};

// Default zoom level
const defaultMapZoom = 15;

// Map options
const defaultMapOptions = {
  zoomControl: true,
  tilt: 0,
  gestureHandling: 'cooperative',
  mapTypeId: 'roadmap',
  streetViewControl: true,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export default function ReactGoogleMapsPicker({
  initialLocation,
  onLocationSelect,
  height = '400px',
  className = '',
}: ReactGoogleMapsPickerProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || {
      lat: defaultMapCenter.lat,
      lng: defaultMapCenter.lng,
      address: 'Manila, Philippines',
    },
  );
  const [searchValue, setSearchValue] = useState('');
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom map container style with dynamic height
  const mapContainerStyle = {
    ...defaultMapContainerStyle,
    height: height,
  };

  // Enhanced geocoding function
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });

      if (response.results && response.results.length > 0) {
        // Prioritize results with proper street addresses
        const streetAddress = response.results.find(
          (result) =>
            result.types.includes('street_address') ||
            result.types.includes('premise') ||
            result.types.includes('establishment'),
        );

        if (streetAddress) {
          return streetAddress.formatted_address;
        }

        // Fallback to first result
        return response.results[0].formatted_address;
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Geocoding failed:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  // Handle map click
  const onMapClick = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        const address = await reverseGeocode(lat, lng);
        const location = { lat, lng, address };

        setSelectedLocation(location);
        onLocationSelect(location);
      }
    },
    [reverseGeocode, onLocationSelect],
  );

  // Handle marker drag
  const onMarkerDragEnd = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        const address = await reverseGeocode(lat, lng);
        const location = { lat, lng, address };

        setSelectedLocation(location);
        onLocationSelect(location);
      }
    },
    [reverseGeocode, onLocationSelect],
  );

  // Handle search
  const handleSearch = async () => {
    if (!map || !searchValue.trim()) return;

    try {
      setIsLocationLoading(true);
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({
        address: searchValue,
        componentRestrictions: { country: 'PH' },
      });

      if (response.results.length > 0) {
        const result = response.results[0];
        const location = result.geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const address = result.formatted_address;

        const newLocation = { lat, lng, address };
        setSelectedLocation(newLocation);
        onLocationSelect(newLocation);

        map.panTo({ lat, lng });
        map.setZoom(16);
        setSearchValue('');
      } else {
        setError('Location not found. Please try a different search term.');
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setError('Search failed. Please check your internet connection.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Handle current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (map) {
          map.setCenter({ lat, lng });
          map.setZoom(17);

          const address = await reverseGeocode(lat, lng);
          const location = { lat, lng, address };
          setSelectedLocation(location);
          onLocationSelect(location);
        }
        setIsLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation failed:', error);
        setError('Failed to get current location');
        setTimeout(() => setError(null), 3000);
        setIsLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (error) {
    return (
      <div
        className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg ${className}`}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for a location..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 pr-4"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSearch}
            disabled={!searchValue.trim() || isLocationLoading}
            size="sm"
          >
            {isLocationLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </Button>

          <Button
            variant="outline"
            onClick={handleCurrentLocation}
            disabled={isLocationLoading}
            size="sm"
            title="Use current location"
          >
            {isLocationLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Selected Location Display */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900 mb-1">Selected Location</p>
            <p className="text-sm text-blue-700 break-words">{selectedLocation.address}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-blue-600">
              <span>Lat: {selectedLocation.lat.toFixed(6)}</span>
              <span>Lng: {selectedLocation.lng.toFixed(6)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Google Map */}
      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={selectedLocation}
          zoom={defaultMapZoom}
          options={defaultMapOptions}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={onMapClick}
        >
          <Marker position={selectedLocation} draggable={true} onDragEnd={onMarkerDragEnd} />
        </GoogleMap>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">How to use:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            Click anywhere on the map to select
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            Drag the marker to adjust
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            Search for specific places
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
            Use GPS for current location
          </div>
        </div>
      </div>
    </div>
  );
}
