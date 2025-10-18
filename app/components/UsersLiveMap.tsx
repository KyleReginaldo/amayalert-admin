'use client';

import { supabase } from '@/app/client/supabase';
import { assertGoogleMapsApiKey } from '@/app/lib/env';
import { User } from '@/app/lib/users-api';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Database } from '@/database.types';
import { Loader } from '@googlemaps/js-api-loader';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { MapPin } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type UserWithLocation = User & { latitude: number; longitude: number };

interface UsersLiveMapProps {
  users: UserWithLocation[];
  height?: string;
  className?: string;
  onUserClick?: (user: User) => void;
}

export default function UsersLiveMap({
  users,
  height = '520px',
  className = '',
  onUserClick,
}: UsersLiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const usersWithLocation = useMemo(
    () => users.filter((u) => typeof u.latitude === 'number' && typeof u.longitude === 'number'),
    [users],
  );

  // Initialize map
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const loader = new Loader({ apiKey: assertGoogleMapsApiKey(), version: 'weekly' });
        const google = await loader.load();
        if (!mapRef.current) return;

        // Compute bounds from current users
        const bounds = new google.maps.LatLngBounds();
        usersWithLocation.forEach((u) => bounds.extend({ lat: u.latitude!, lng: u.longitude! }));

        const center = usersWithLocation.length
          ? bounds.getCenter()
          : new google.maps.LatLng(14.5995, 120.9842); // Manila default

        const m = new google.maps.Map(mapRef.current, {
          center,
          zoom: usersWithLocation.length ? 11 : 12,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
        });
        if (usersWithLocation.length) m.fitBounds(bounds);
        setMap(m);
        setIsLoading(false);
      } catch (e) {
        console.error('UsersLiveMap init error:', e);
        setError('Failed to load Google Maps. Check API key/billing/domain restrictions.');
        setIsLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render markers whenever usersWithLocation changes or map is ready
  useEffect(() => {
    if (!map || !window.google) return;

    const g = window.google;
    const existing = markersRef.current;

    // Update or add markers
    const seen = new Set<string>();
    for (const u of usersWithLocation) {
      seen.add(u.id);
      const pos = new g.maps.LatLng(u.latitude!, u.longitude!);
      let marker = existing.get(u.id);
      if (!marker) {
        marker = new g.maps.Marker({
          position: pos,
          map,
          title: u.full_name || u.email,
          icon: {
            url:
              'data:image/svg+xml;base64,' +
              btoa(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#2563eb"/>
                </svg>
              `),
            scaledSize: new g.maps.Size(24, 24),
            anchor: new g.maps.Point(12, 24),
          },
        });
        marker.addListener('click', () => {
          const html = `
            <div style="max-width:260px;padding:8px 4px;">
              <div style="font-weight:600;color:#111827">${u.full_name || 'No Name'}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:2px">${u.email}</div>
              <div style="font-size:12px;color:#374151;margin-top:6px">Phone: ${
                u.phone_number || '—'
              }</div>
              <div style="font-size:12px;color:#374151;margin-top:2px">Role: ${
                u.role || 'user'
              }</div>
            </div>`;
          if (!infoWindowRef.current) infoWindowRef.current = new g.maps.InfoWindow();
          infoWindowRef.current.setContent(html);
          infoWindowRef.current.open({ map, anchor: marker! });
          if (onUserClick) onUserClick(u);
        });
        existing.set(u.id, marker);
      } else {
        marker.setPosition(pos);
        marker.setTitle(u.full_name || u.email);
      }
    }

    // Remove markers for users no longer present
    for (const [id, marker] of existing.entries()) {
      if (!seen.has(id)) {
        marker.setMap(null);
        existing.delete(id);
      }
    }
  }, [map, usersWithLocation, onUserClick]);

  // Subscribe to realtime updates for users table
  useEffect(() => {
    type UserRow = Database['public']['Tables']['users']['Row'];
    const channel = supabase
      .channel('users-live-map')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload: RealtimePostgresChangesPayload<UserRow>) => {
          if (!map || !window.google) return;
          const g = window.google;

          const rowNew = payload.new as UserRow | null;
          const rowOld = payload.old as UserRow | null;
          const subject = rowNew ?? rowOld;
          if (!subject) return;

          const marker = markersRef.current.get(subject.id);

          if (payload.eventType === 'DELETE') {
            if (marker) {
              marker.setMap(null);
              markersRef.current.delete(subject.id);
            }
            return;
          }

          const lat = rowNew?.latitude ?? null;
          const lng = rowNew?.longitude ?? null;

          if (lat == null || lng == null) {
            if (marker) {
              marker.setMap(null);
              markersRef.current.delete(subject.id);
            }
            return;
          }

          const pos = new g.maps.LatLng(lat, lng);
          if (marker) {
            marker.setPosition(pos);
          } else {
            const m = new g.maps.Marker({ position: pos, map });
            markersRef.current.set(subject.id, m);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [map]);

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
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing <strong>{usersWithLocation.length}</strong> user(s) with live location
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Realtime</Badge>
        </div>
      </div>
      <Card className="relative overflow-hidden border border-gray-200">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-50/70 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 font-medium">Loading users map...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} style={{ height }} className="w-full" />
      </Card>
    </div>
  );
}
