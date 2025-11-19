/* 
Since the map was loaded on client side, 
we need to make this component client rendered as well else error occurs
*/
'use client';

import { Button } from '@/components/ui/button';
//Map component Component from library
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Autocomplete, GoogleMap, Marker } from '@react-google-maps/api';
import { MapPin, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

//Map's styling
export const defaultMapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
};

const defaultMapCenter = {
  lat: 14.5995, // Manila, Philippines
  lng: 120.9842,
};

const defaultMapZoom = 13;

const defaultMapOptions = {
  zoomControl: true,
  tilt: 0,
  gestureHandling: 'auto',
  mapTypeId: 'roadmap',
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

interface MapComponentProps {
  initialLocation?: { lat: number; lng: number; address?: string };
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  height?: string;
  className?: string;
}

const MapComponent = ({
  initialLocation,
  onLocationSelect,
  height = '400px',
  className = '',
}: MapComponentProps) => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : null,
  );
  const [mapCenter, setMapCenter] = useState(
    initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : defaultMapCenter,
  );
  const [searchValue, setSearchValue] = useState(initialLocation?.address || '');
  // Removed hasUserSelected (unused)

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Automatically get current location only once on mount if no initial location
  const ranAutoLocate = useRef(false);
  useEffect(() => {
    if (ranAutoLocate.current) return;
    if (initialLocation) return;
    if (!navigator.geolocation) return;
    ranAutoLocate.current = true;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setSelectedLocation({ lat, lng });
        setMapCenter({ lat, lng });

        // Wait for geocoder to be available, then reverse geocode
        const reverseGeocode = async () => {
          if (geocoderRef.current) {
            try {
              const response = await new Promise<google.maps.GeocoderResult[]>(
                (resolve, reject) => {
                  geocoderRef.current!.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results) {
                      resolve(results);
                    } else {
                      reject(new Error(status));
                    }
                  });
                },
              );

              if (response && response[0]) {
                const address = response[0].formatted_address;
                // Autofill the address field
                setSearchValue((prev) => (prev ? prev : address));

                if (onLocationSelect) {
                  onLocationSelect({ lat, lng, address });
                }
              }
            } catch (error) {
              console.error('Reverse geocoding failed:', error);
              if (onLocationSelect) {
                onLocationSelect({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
              }
            }
          } else {
            // If geocoder is not ready yet, try again after a short delay
            setTimeout(reverseGeocode, 500);
          }
        };

        reverseGeocode();
      },
      (error) => {
        console.error('Error getting current location:', error);
        // Optionally show a user-friendly message here
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // Cache for 1 minute
      },
    );
  }, [initialLocation, onLocationSelect]);

  // Initialize geocoder when map loads
  const onMapLoad = useCallback((map: google.maps.Map) => {
    geocoderRef.current = new google.maps.Geocoder();
    mapInstanceRef.current = map;
  }, []);

  // Handle place selection from autocomplete
  const onPlaceSelected = useCallback(() => {
    try {
      if (!autocompleteRef.current) {
        console.warn('Autocomplete reference not available');
        return;
      }

      const place = autocompleteRef.current.getPlace();

      // Ensure we have a valid place object
      if (!place) {
        console.warn('No place data received from autocomplete');
        return;
      }

      // Ensure we have geometry data
      if (!place.geometry?.location) {
        console.warn('No geometry found for selected place:', place);
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address || place.name || '';

      const newLocation = { lat, lng };
      setSelectedLocation(newLocation);
      setMapCenter(newLocation);
      setSearchValue(address);

      // Zoom the map to the selected place
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(newLocation);
        mapInstanceRef.current.setZoom(16);
      }

      if (onLocationSelect) {
        onLocationSelect({ lat, lng, address });
      }

      // Log successful selection for debugging
      console.log('Place selected successfully:', { lat, lng, address });
    } catch (error) {
      console.error('Error in onPlaceSelected:', error);
    }
  }, [onLocationSelect]); // Handle map click to select location
  const onMapClick = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        setSelectedLocation({ lat, lng });
        // Mark user selection (no-op; state removed)

        // Reverse geocode to get address
        if (geocoderRef.current) {
          try {
            const response = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
              geocoderRef.current!.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results) {
                  resolve(results);
                } else {
                  reject(new Error(status));
                }
              });
            });

            if (response && response[0]) {
              const address = response[0].formatted_address;
              setSearchValue(address);

              if (onLocationSelect) {
                onLocationSelect({ lat, lng, address });
              }
            }
          } catch (error) {
            console.error('Reverse geocoding failed:', error);
            // Fallback: still call onLocationSelect with coordinates
            if (onLocationSelect) {
              onLocationSelect({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
            }
          }
        }
      }
    },
    [onLocationSelect],
  );

  // Handle current location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setSelectedLocation({ lat, lng });
          setMapCenter({ lat, lng });
          // Mark user selection (no-op)

          // Reverse geocode to get address
          if (geocoderRef.current) {
            try {
              const response = await new Promise<google.maps.GeocoderResult[]>(
                (resolve, reject) => {
                  geocoderRef.current!.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results) {
                      resolve(results);
                    } else {
                      reject(new Error(status));
                    }
                  });
                },
              );

              if (response && response[0]) {
                const address = response[0].formatted_address;
                setSearchValue(address);

                if (onLocationSelect) {
                  onLocationSelect({ lat, lng, address });
                }
              }
            } catch (error) {
              console.error('Reverse geocoding failed:', error);
              if (onLocationSelect) {
                onLocationSelect({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
              }
            }
          }
        },
        (error) => {
          console.error('Error getting current location:', error);
        },
      );
    }
  }, [onLocationSelect]);

  const mapContainerStyle = {
    ...defaultMapContainerStyle,
    height,
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <div className="space-y-2">
        <div className="flex gap-4">
          <Label htmlFor="location-search">Search Location</Label>{' '}
          <Button
            size={'sm'}
            type="button"
            variant="default"
            onClick={getCurrentLocation}
            className="shrink-0"
          >
            <MapPin className="h-2 w-2 mr-1" />
            <p className="text-[12px]">Use Current</p>
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-20 pointer-events-none" />
            <Autocomplete
              onLoad={(autocomplete) => {
                autocompleteRef.current = autocomplete;
                // Ensure autocomplete dropdown is properly styled and clickable
                autocomplete.setOptions({
                  componentRestrictions: { country: ['ph'] }, // Restrict to Philippines
                  types: ['establishment', 'geocode'],
                  fields: ['formatted_address', 'geometry', 'name', 'place_id'],
                });
              }}
              onPlaceChanged={onPlaceSelected}
              options={{
                componentRestrictions: { country: ['ph'] }, // Restrict to Philippines
                types: ['establishment', 'geocode'],
                fields: ['formatted_address', 'geometry', 'name', 'place_id'],
              }}
            >
              <Input
                id="location-search"
                placeholder="Search for a place..."
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  // typing counts as user interaction (no-op)
                }}
                autoComplete="off"
                className="pl-10 relative z-10 pac-target-input"
                style={{ position: 'relative', zIndex: 10 }}
              />
            </Autocomplete>

            {searchValue && (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-20"
                onClick={() => {
                  setSearchValue('');
                  setSelectedLocation(null);
                  // keep user-interacted state (no-op)
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Search for a location above, click on dropdown suggestions, or click on the map to select
          a point
        </p>
      </div>{' '}
      <div className="border rounded-lg overflow-hidden map-container">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={defaultMapZoom}
          options={defaultMapOptions}
          onClick={onMapClick}
          onLoad={onMapLoad}
        >
          {selectedLocation && (
            <Marker
              position={selectedLocation}
              icon={{
                url:
                  'data:image/svg+xml;base64,' +
                  btoa(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ef4444"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(24, 24),
                anchor: new google.maps.Point(12, 24),
              }}
            />
          )}
        </GoogleMap>
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
