'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { MapProvider } from '../providers/map-provider';
import { MapComponent } from './map-component';

interface SmartMapPickerProps {
  initialLocation?: { lat: number; lng: number; address?: string };
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  height?: string;
  className?: string;
}

export default function SmartMapPicker({
  initialLocation,
  onLocationSelect,
  height = '400px',
  className = '',
}: SmartMapPickerProps) {
  const [hasError] = useState(false);

  // If Google Maps fails, show error and fallback to OpenStreetMap
  if (hasError) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Google Maps failed to load. This might be due to API key issues, network problems, or
            billing restrictions. Using OpenStreetMap as fallback.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Use the MapProvider with the enhanced MapComponent
  return (
    <div className={className}>
      <MapProvider>
        <MapComponent
          initialLocation={initialLocation}
          onLocationSelect={onLocationSelect}
          height={height}
          className="w-full"
        />
      </MapProvider>
    </div>
  );
}
