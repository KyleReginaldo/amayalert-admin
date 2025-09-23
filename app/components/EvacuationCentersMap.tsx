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
  capacity: number | null;
  current_occupancy: number | null;
  status: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  photos: string[] | null;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
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

  // Create marker icon based on center status
  const createMarkerIcon = useCallback((center: EvacuationCenter) => {
    const currentOccupancy = center.current_occupancy || 0;
    const capacity = center.capacity || 0;

    const status =
      capacity > 0 && currentOccupancy >= capacity
        ? 'full'
        : capacity > 0 && currentOccupancy >= capacity * 0.8
        ? 'almost-full'
        : 'available';

    const color =
      status === 'available' ? '#22c55e' : status === 'almost-full' ? '#f59e0b' : '#ef4444';

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
            <circle cx="20" cy="20" r="16" fill="${color}" stroke="white" stroke-width="3" opacity="0.8"/>
            <circle cx="20" cy="20" r="4" fill="white"/>
          </svg>
        `)}`,
      scaledSize: new google.maps.Size(30, 30),
      anchor: new google.maps.Point(15, 15),
    };
  }, []);

  // Create info window content
  const createInfoWindowContent = useCallback(
    (center: EvacuationCenter) => {
      const currentOccupancy = center.current_occupancy || 0;
      const capacity = center.capacity || 0;
      const occupancyPercentage =
        capacity > 0 ? Math.round((currentOccupancy / capacity) * 100) : 0;

      const status =
        capacity > 0 && currentOccupancy >= capacity
          ? 'Full'
          : capacity > 0 && currentOccupancy >= capacity * 0.8
          ? 'Almost Full'
          : 'Available';

      return `
        <div style="max-width: 300px; padding: 12px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">${
            center.name
          }</h3>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${center.address}</p>
          
          <div style="display: flex; gap: 8px; margin: 8px 0;">
            <span style="background: ${
              status === 'Available' ? '#dcfce7' : status === 'Almost Full' ? '#fef3c7' : '#fee2e2'
            }; color: ${
        status === 'Available' ? '#16a34a' : status === 'Almost Full' ? '#d97706' : '#dc2626'
      }; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
              ${status}
            </span>
          </div>
          
          <div style="margin: 8px 0; font-size: 14px; color: #374151;">
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span>Capacity:</span>
              <span><strong>${currentOccupancy}/${capacity}</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span>Occupancy:</span>
              <span><strong>${occupancyPercentage}%</strong></span>
            </div>
          </div>
          
          ${
            center.contact_phone
              ? `
            <div style="margin: 8px 0; font-size: 14px; color: #374151;">
              <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>Contact:</span>
                <span><strong>${center.contact_phone}</strong></span>
              </div>
            </div>
          `
              : ''
          }
          
          ${
            onCenterSelect
              ? `
            <button 
              onclick="selectEvacuationCenter(${center.id})"
              style="
                width: 100%; 
                background: #2563eb; 
                color: white; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 6px; 
                font-size: 14px; 
                font-weight: 500; 
                cursor: pointer; 
                margin-top: 8px;
              "
              onmouseover="this.style.background='#1d4ed8'"
              onmouseout="this.style.background='#2563eb'"
            >
              Select This Center
            </button>
          `
              : ''
          }
        </div>
      `;
    },
    [onCenterSelect],
  ); // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API || '',
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
    markers, // Re-added markers dependency
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
      {/* Map Statistics - Hidden on mobile to save space */}
      <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {/* Legend - Simplified for mobile */}
        <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-white rounded-lg shadow-md p-2 md:p-3 text-xs">
          <h4 className="font-medium mb-1 md:mb-2 hidden md:block">Center Status</h4>
          <div className="flex md:flex-col gap-2 md:gap-1">
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full"></div>
              <span className="hidden md:inline">Open</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full"></div>
              <span className="hidden md:inline">Full</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-amber-500 rounded-full"></div>
              <span className="hidden md:inline">Maintenance</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-gray-500 rounded-full"></div>
              <span className="hidden md:inline">Closed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Center Details - Mobile optimized */}
      {selectedCenter && (
        <Card className="md:block">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <span className="truncate">{selectedCenter.name}</span>
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

              <div className="flex items-center gap-4 flex-wrap">
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
