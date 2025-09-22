'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from '@googlemaps/js-api-loader';
import { Building2, MapPin, Users, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface EvacuationCenter {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity?: number;
  current_occupancy?: number;
  status?: string;
  contact_name?: string;
  contact_phone?: string;
}

interface EvacuationCentersMapProps {
  centers: EvacuationCenter[];
  height?: string;
  className?: string;
  onCenterSelect?: (center: EvacuationCenter) => void;
}

export default function EvacuationCentersMap({
  centers,
  height = '500px',
  className = '',
  onCenterSelect,
}: EvacuationCentersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [markerCluster] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<EvacuationCenter | null>(null);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);

  // Create custom marker icon based on center status
  const createMarkerIcon = useCallback((center: EvacuationCenter) => {
    let color = '#10b981'; // green for open
    if (center.status === 'full') color = '#ef4444'; // red for full
    else if (center.status === 'maintenance') color = '#f59e0b'; // amber for maintenance
    else if (center.status === 'closed') color = '#6b7280'; // gray for closed

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 8,
    };
  }, []);

  // Create info window content
  const createInfoWindowContent = useCallback((center: EvacuationCenter) => {
    const occupancyPercentage = center.capacity
      ? Math.round(((center.current_occupancy || 0) / center.capacity) * 100)
      : 0;

    return `
      <div style="max-width: 280px; padding: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <div style="width: 32px; height: 32px; background: #3b82f6; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 1.09-.21 2-.6 2.78-1.15C15.92 25.46 18 23.35 18 21V7l-6-5z"/>
            </svg>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">${
              center.name
            }</h3>
            <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; color: white; background: ${
              center.status === 'open'
                ? '#10b981'
                : center.status === 'full'
                ? '#ef4444'
                : center.status === 'maintenance'
                ? '#f59e0b'
                : '#6b7280'
            };">
              ${(center.status || 'closed').toUpperCase()}
            </span>
          </div>
        </div>
        
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
          📍 ${center.address}
        </div>
        
        ${
          center.capacity
            ? `
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
              <span>Occupancy</span>
              <span>${center.current_occupancy || 0}/${
                center.capacity
              } (${occupancyPercentage}%)</span>
            </div>
            <div style="width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
              <div style="width: ${Math.min(
                occupancyPercentage,
                100,
              )}%; height: 100%; background: ${
                occupancyPercentage >= 90
                  ? '#ef4444'
                  : occupancyPercentage >= 75
                  ? '#f59e0b'
                  : '#10b981'
              }; border-radius: 3px;"></div>
            </div>
          </div>
        `
            : ''
        }
        
        ${
          center.contact_name || center.contact_phone
            ? `
          <div style="padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 12px;">
            ${
              center.contact_name
                ? `<div><strong>Contact:</strong> ${center.contact_name}</div>`
                : ''
            }
            ${
              center.contact_phone
                ? `<div><strong>Phone:</strong> ${center.contact_phone}</div>`
                : ''
            }
          </div>
        `
            : ''
        }
        
        <div style="margin-top: 8px;">
          <button 
            onclick="window.selectEvacuationCenter(${center.id})"
            style="width: 100%; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;"
          >
            View Details
          </button>
        </div>
      </div>
    `;
  }, []);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places', 'geometry'],
        });

        const google = await loader.load();

        if (!mapRef.current) return;

        // Calculate bounds for all centers
        const bounds = new google.maps.LatLngBounds();
        centers.forEach((center) => {
          bounds.extend({ lat: center.latitude, lng: center.longitude });
        });

        const mapOptions: google.maps.MapOptions = {
          center: bounds.getCenter(),
          zoom: 10,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        };

        const newMap = new google.maps.Map(mapRef.current, mapOptions);
        setMap(newMap);

        // Fit map to show all centers
        if (centers.length > 0) {
          newMap.fitBounds(bounds);
          if (centers.length === 1) {
            newMap.setZoom(15);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setError('Failed to load Google Maps. Please check your internet connection.');
        setIsLoading(false);
      }
    };

    initMap();
  }, [centers]);

  // Create markers when map is ready
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));
    if (markerCluster) {
      markerCluster.clearMarkers();
    }

    // Create new markers
    const newMarkers = centers.map((center) => {
      const marker = new google.maps.Marker({
        position: { lat: center.latitude, lng: center.longitude },
        map: map,
        title: center.name,
        icon: createMarkerIcon(center),
        animation: google.maps.Animation.DROP,
      });

      // Add click listener
      marker.addListener('click', () => {
        if (infoWindow) {
          infoWindow.close();
        }

        const newInfoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent(center),
        });

        newInfoWindow.open(map, marker);
        setInfoWindow(newInfoWindow);
        setSelectedCenter(center);
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Add marker clustering if there are many centers
    if (newMarkers.length > 5) {
      // Note: You might want to install @googlemaps/markerclusterer for better clustering
      // For now, we'll use a simple clustering approach
    }

    // Global function for info window button
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as Record<string, any>).selectEvacuationCenter = (centerId: number) => {
      const center = centers.find((c) => c.id === centerId);
      if (center && onCenterSelect) {
        onCenterSelect(center);
      }
    };
  }, [
    map,
    centers,
    createMarkerIcon,
    createInfoWindowContent,
    infoWindow,
    onCenterSelect,
    markerCluster,
    markers,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markers.forEach((marker) => marker.setMap(null));
      if (infoWindow) {
        infoWindow.close();
      }
      if (markerCluster) {
        markerCluster.clearMarkers();
      }
    };
  }, [markers, infoWindow, markerCluster]);

  if (error) {
    return (
      <div
        className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg ${className}`}
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-lg font-bold">{centers.length}</p>
              <p className="text-xs text-gray-600">Total Centers</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-lg font-bold">
                {centers.filter((c) => c.status === 'open').length}
              </p>
              <p className="text-xs text-gray-600">Available</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div>
              <p className="text-lg font-bold">
                {centers.filter((c) => c.status === 'full').length}
              </p>
              <p className="text-xs text-gray-600">Full</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-lg font-bold">
                {centers.reduce((sum, c) => sum + (c.capacity || 0), 0)}
              </p>
              <p className="text-xs text-gray-600">Total Capacity</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600 font-medium">Loading evacuation centers map...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} style={{ height }} className="w-full" />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 text-xs">
          <h4 className="font-medium mb-2">Center Status</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Open</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Full</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span>Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span>Closed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Center Details */}
      {selectedCenter && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedCenter.name}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCenter(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Address</p>
                <p className="text-sm text-gray-600">{selectedCenter.address}</p>
              </div>

              <div className="flex items-center gap-4">
                <Badge
                  variant={
                    selectedCenter.status === 'open'
                      ? 'default'
                      : selectedCenter.status === 'full'
                      ? 'destructive'
                      : selectedCenter.status === 'maintenance'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {selectedCenter.status || 'closed'}
                </Badge>

                {selectedCenter.capacity && (
                  <div className="text-sm">
                    <span className="font-medium">Capacity:</span>{' '}
                    {selectedCenter.current_occupancy || 0}/{selectedCenter.capacity}
                  </div>
                )}
              </div>

              {(selectedCenter.contact_name || selectedCenter.contact_phone) && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Contact Information</p>
                  <div className="text-sm text-gray-600">
                    {selectedCenter.contact_name && <p>{selectedCenter.contact_name}</p>}
                    {selectedCenter.contact_phone && <p>{selectedCenter.contact_phone}</p>}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
