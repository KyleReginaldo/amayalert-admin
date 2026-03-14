'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  useMap,
} from '@/components/ui/map';
import { Building2, MapPin, Users, X } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { useEffect, useMemo, useState } from 'react';

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

const defaultCenter: [number, number] = [120.9842, 14.5995];
const defaultZoom = 11;

function CentersFitBounds({ centers }: { centers: EvacuationCenter[] }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    if (!centers.length) {
      map.easeTo({ center: defaultCenter, zoom: defaultZoom });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    centers.forEach((center) => bounds.extend([center.longitude, center.latitude]));
    map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 300 });
  }, [map, isLoaded, centers]);

  return null;
}

function getMarkerColor(center: EvacuationCenter) {
  const currentOccupancy = center.current_occupancy || 0;
  const capacity = center.capacity || 0;

  if (capacity > 0 && currentOccupancy >= capacity) return '#ef4444';
  if (capacity > 0 && currentOccupancy >= capacity * 0.8) return '#f59e0b';
  return '#22c55e';
}

export default function EvacuationCentersMap({
  centers,
  height = '500px',
  className = '',
  onCenterSelect,
}: EvacuationCentersMapProps) {
  const [selectedCenter, setSelectedCenter] = useState<EvacuationCenter | null>(null);

  const stats = useMemo(
    () => ({
      total: centers.length,
      open: centers.filter((c) => c.status === 'open').length,
      full: centers.filter((c) => c.status === 'full').length,
      capacity: centers.reduce((sum, c) => sum + (c.capacity || 0), 0),
    }),
    [centers],
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="hidden grid-cols-2 gap-4 md:grid md:grid-cols-4">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-lg font-bold">{stats.total}</p>
              <p className="text-xs text-gray-600">Total Centers</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <div>
              <p className="text-lg font-bold">{stats.open}</p>
              <p className="text-xs text-gray-600">Open</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div>
              <p className="text-lg font-bold">{stats.full}</p>
              <p className="text-xs text-gray-600">Full</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-lg font-bold">{stats.capacity}</p>
              <p className="text-xs text-gray-600">Total Capacity</p>
            </div>
          </div>
        </Card>
      </div>

      <div
        className="relative overflow-hidden rounded-lg border border-gray-200 shadow-sm"
        style={{ height }}
      >
        <Map center={defaultCenter} zoom={defaultZoom} theme="light">
          <CentersFitBounds centers={centers} />
          <MapControls position="bottom-right" showLocate={false} />
          {centers.map((center) => (
            <MapMarker
              key={center.id}
              longitude={center.longitude}
              latitude={center.latitude}
              onClick={() => setSelectedCenter(center)}
            >
              <MarkerContent>
                <div className="relative flex items-center justify-center">
                  <div
                    className="absolute h-10 w-10 rounded-full"
                    style={{ backgroundColor: `${getMarkerColor(center)}33` }}
                  />
                  <div
                    className="h-3 w-3 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: getMarkerColor(center) }}
                  />
                </div>
              </MarkerContent>
              <MarkerPopup className="min-w-[240px]">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">{center.name}</div>
                  <div className="text-xs text-slate-500">{center.address}</div>
                  <div className="text-xs text-slate-600">
                    Capacity: {center.current_occupancy || 0}/{center.capacity || 0}
                  </div>
                  {center.contact_phone && (
                    <div className="text-xs text-slate-600">Contact: {center.contact_phone}</div>
                  )}
                  {onCenterSelect && (
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      onClick={() => onCenterSelect(center)}
                    >
                      Select This Center
                    </Button>
                  )}
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}
        </Map>

        <div className="absolute bottom-2 left-2 rounded-lg bg-white p-2 text-xs shadow-md md:bottom-4 md:left-4 md:p-3">
          <h4 className="mb-1 hidden font-medium md:block">Center Status</h4>
          <div className="flex gap-2 md:flex-col md:gap-1">
            <div className="flex items-center gap-1 md:gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 md:h-3 md:w-3" />
              <span className="hidden md:inline">Open</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500 md:h-3 md:w-3" />
              <span className="hidden md:inline">Almost Full</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 md:h-3 md:w-3" />
              <span className="hidden md:inline">Full</span>
            </div>
          </div>
        </div>
      </div>

      {selectedCenter && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
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
              <div className="flex flex-wrap items-center gap-4">
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

      {centers.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          No evacuation centers available yet.
        </div>
      )}
    </div>
  );
}
