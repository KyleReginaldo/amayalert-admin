'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
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

  // If map fails, show error and fallback to a text-only prompt
  if (hasError) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            The map failed to load. This might be due to network problems or map tile availability.
            Please try again or use manual entry.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      <MapComponent
        initialLocation={initialLocation}
        onLocationSelect={onLocationSelect}
        height={height}
        className="w-full border-none"
      />
    </div>
  );
}
