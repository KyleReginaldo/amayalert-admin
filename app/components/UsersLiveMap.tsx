'use client';

import { supabase } from '@/app/client/supabase';
import { User } from '@/app/lib/users-api';
import { Card } from '@/components/ui/card';
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  useMap,
} from '@/components/ui/map';
import type { Database } from '@/database.types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { MapPin } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { useEffect, useMemo, useState } from 'react';

type UserWithLocation = User & { latitude: number; longitude: number };

interface UsersLiveMapProps {
  users: UserWithLocation[];
  height?: string;
  className?: string;
  onUserClick?: (user: User) => void;
  fitSignal?: number;
}

const defaultCenter: [number, number] = [120.9842, 14.5995];
const defaultZoom = 12;

const isGuestUser = (user?: Pick<User, 'full_name'> | null) => user?.full_name === 'Guest User';

function UsersFitBounds({
  users,
  fitSignal = 0,
}: {
  users: UserWithLocation[];
  fitSignal?: number;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    if (!users.length) {
      map.easeTo({ center: defaultCenter, zoom: defaultZoom });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    users.forEach((user) => bounds.extend([user.longitude, user.latitude]));
    map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 300 });
  }, [map, isLoaded, users, fitSignal]);

  return null;
}

export default function UsersLiveMap({
  users,
  height = '520px',
  className = '',
  onUserClick,
  fitSignal,
}: UsersLiveMapProps) {
  const baseUsers = useMemo(
    () =>
      users.filter(
        (u) => Number.isFinite(u.latitude) && Number.isFinite(u.longitude) && !isGuestUser(u),
      ),
    [users],
  );
  const [liveUsers, setLiveUsers] = useState<UserWithLocation[]>(baseUsers);

  useEffect(() => {
    setLiveUsers(baseUsers);
  }, [baseUsers]);

  useEffect(() => {
    type UserRow = Database['public']['Tables']['users']['Row'];

    const channel = supabase
      .channel('users-live-map')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload: RealtimePostgresChangesPayload<UserRow>) => {
          const rowNew = payload.new as UserRow | null;
          const rowOld = payload.old as UserRow | null;
          const subject = rowNew ?? rowOld;
          if (!subject) return;

          if (isGuestUser(subject)) {
            setLiveUsers((prev) => prev.filter((u) => u.id !== subject.id));
            return;
          }

          setLiveUsers((prev) => {
            if (payload.eventType === 'DELETE') {
              return prev.filter((u) => u.id !== subject.id);
            }

            const lat = rowNew?.latitude ?? null;
            const lng = rowNew?.longitude ?? null;
            if (lat == null || lng == null) {
              return prev.filter((u) => u.id !== subject.id);
            }

            const existing = prev.find((u) => u.id === subject.id);
            const updated = {
              ...(existing || {}),
              ...(rowNew || subject),
              latitude: lat,
              longitude: lng,
            } as UserWithLocation;

            if (existing) {
              return prev.map((u) => (u.id === subject.id ? updated : u));
            }

            return [updated, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing <strong>{liveUsers.length}</strong> user(s) with live location
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Realtime</Badge>
        </div>
      </div> */}

      <Card className="relative overflow-hidden border border-gray-200">
        <div style={{ height }} className="w-full">
          <Map center={defaultCenter} zoom={defaultZoom} theme="light">
            <UsersFitBounds users={liveUsers} fitSignal={fitSignal} />
            <MapControls position="bottom-right" showLocate={false} />
            {liveUsers.map((user) => (
              <MapMarker
                key={user.id}
                longitude={user.longitude}
                latitude={user.latitude}
                onClick={() => onUserClick?.(user)}
              >
                <MarkerContent>
                  <div className="relative flex items-center justify-center">
                    <div className="absolute h-10 w-10 rounded-full bg-blue-500/20" />
                    <div className="h-3 w-3 rounded-full bg-blue-600 shadow" />
                  </div>
                </MarkerContent>
                <MarkerPopup className="min-w-[220px]">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-900">
                      {user.full_name || 'No Name'}
                    </div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                    <div className="text-xs text-slate-600">Phone: {user.phone_number || '—'}</div>
                    <div className="text-xs text-slate-600">Role: {user.role || 'user'}</div>
                  </div>
                </MarkerPopup>
              </MapMarker>
            ))}
          </Map>
        </div>
      </Card>

      {liveUsers.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="h-4 w-4" />
          No users with location data to display.
        </div>
      )}
    </div>
  );
}
