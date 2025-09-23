/* 
Since the map was loaded on client side, 
we need to make this component client rendered as well else error occurs
*/
'use client';

//Map component Component from library
import { Button } from '@/components/ui/button';
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
  const [hasUserSelected, setHasUserSelected] = useState(!!initialLocation); // Track if user has manually selected a location

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Automatically get current location on component mount if no initial location provided
  // and no location has been manually selected yet
  useEffect(() => {
    if (!initialLocation && !hasUserSelected && navigator.geolocation) {
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
    }
  }, [initialLocation, hasUserSelected, onLocationSelect]);

  // Initialize geocoder when map loads
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onMapLoad = useCallback((_map: google.maps.Map) => {
    geocoderRef.current = new google.maps.Geocoder();
  }, []);

  // Handle place selection from autocomplete
  const onPlaceSelected = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || place.name || '';

        const newLocation = { lat, lng };
        setSelectedLocation(newLocation);
        setMapCenter(newLocation);
        setSearchValue(address);
        setHasUserSelected(true); // Mark as user selected

        if (onLocationSelect) {
          onLocationSelect({ lat, lng, address });
        }
      }
    }
  }, [onLocationSelect]);

  // Handle map click to select location
  const onMapClick = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        setSelectedLocation({ lat, lng });
        setHasUserSelected(true); // Mark as user selected

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
          setHasUserSelected(true); // Mark as user selected (intentional button click)

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
        <Label htmlFor="location-search">Search Location</Label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Autocomplete
              onLoad={(autocomplete) => {
                autocompleteRef.current = autocomplete;
              }}
              onPlaceChanged={onPlaceSelected}
              options={{
                componentRestrictions: { country: ['ph'] }, // Restrict to Philippines
                types: ['establishment', 'geocode'],
              }}
            >
              <Input
                id="location-search"
                placeholder="Search for a place..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
              />
            </Autocomplete>
          </div>
          <Button type="button" variant="outline" onClick={getCurrentLocation} className="shrink-0">
            <MapPin className="h-4 w-4 mr-2" />
            Use Current
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Search for a location above or click on the map to select a point
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
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
