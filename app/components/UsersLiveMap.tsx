'use client';

import { supabase } from '@/app/client/supabase';
import { User } from '@/app/lib/users-api';
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
import { ExternalLink, Maximize2, MapPin, Search, X } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState } from 'react';

type UserWithLocation = User & { latitude: number; longitude: number };

interface UsersLiveMapProps {
  users: UserWithLocation[];
  height?: string;
  className?: string;
  onUserClick?: (user: User) => void;
  fitSignal?: number;
  onCenterAll?: () => void;
}

const defaultCenter: [number, number] = [120.9842, 14.5995];
const defaultZoom = 12;

const isGuestUser = (user?: Pick<User, 'full_name'> | null) => user?.full_name === 'Guest User';

function UsersFitBounds({ users, fitSignal = 0 }: { users: UserWithLocation[]; fitSignal?: number }) {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded) return;
    if (!users.length) { map.easeTo({ center: defaultCenter, zoom: defaultZoom }); return; }
    const bounds = new maplibregl.LngLatBounds();
    users.forEach((u) => bounds.extend([u.longitude, u.latitude]));
    map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 300 });
  }, [map, isLoaded, users, fitSignal]);
  return null;
}

function FlyToTarget({ target }: { target: UserWithLocation | null }) {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded || !target) return;
    map.flyTo({ center: [target.longitude, target.latitude], zoom: 16, duration: 900 });
  }, [map, isLoaded, target]);
  return null;
}

function UserAvatar({ user, size = 'md' }: { user: Pick<User, 'profile_picture' | 'full_name'>; size?: 'sm' | 'md' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const dim = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  return (
    <div className={`${dim} rounded-full border-2 border-white shadow overflow-hidden bg-blue-500 flex items-center justify-center shrink-0`}>
      {user.profile_picture && !imgFailed ? (
        <img src={user.profile_picture} alt={user.full_name || 'User'} className="h-full w-full object-cover" onError={() => setImgFailed(true)} />
      ) : (
        <span className="text-white font-bold select-none">{(user.full_name || '?').charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

export default function UsersLiveMap({ users, height = '520px', className = '', onUserClick, fitSignal, onCenterAll }: UsersLiveMapProps) {
  const baseUsers = useMemo(
    () => users.filter((u) => Number.isFinite(u.latitude) && Number.isFinite(u.longitude) && !isGuestUser(u)),
    [users],
  );
  const [liveUsers, setLiveUsers] = useState<UserWithLocation[]>(baseUsers);
  const [flyTarget, setFlyTarget] = useState<UserWithLocation | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLiveUsers(baseUsers); }, [baseUsers]);

  // Close list on outside click
  useEffect(() => {
    if (!listOpen) return;
    const handler = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setListOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [listOpen]);

  useEffect(() => {
    type UserRow = Database['public']['Tables']['users']['Row'];
    const channel = supabase.channel('users-live-map').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users' },
      (payload: RealtimePostgresChangesPayload<UserRow>) => {
        const rowNew = payload.new as UserRow | null;
        const rowOld = payload.old as UserRow | null;
        const subject = rowNew ?? rowOld;
        if (!subject) return;
        if (isGuestUser(subject)) { setLiveUsers((prev) => prev.filter((u) => u.id !== subject.id)); return; }
        setLiveUsers((prev) => {
          if (payload.eventType === 'DELETE') return prev.filter((u) => u.id !== subject.id);
          const lat = rowNew?.latitude ?? null;
          const lng = rowNew?.longitude ?? null;
          if (lat == null || lng == null) return prev.filter((u) => u.id !== subject.id);
          const existing = prev.find((u) => u.id === subject.id);
          const updated = { ...(existing || {}), ...(rowNew || subject), latitude: lat, longitude: lng } as UserWithLocation;
          if (existing) return prev.map((u) => (u.id === subject.id ? updated : u));
          return [updated, ...prev];
        });
      },
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return liveUsers;
    return liveUsers.filter(
      (u) => u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q),
    );
  }, [liveUsers, search]);

  const handleLocate = (user: UserWithLocation) => {
    setFlyTarget(user);
    setListOpen(false);
    setSearch('');
  };

  const handleViewProfile = (e: React.MouseEvent, user: UserWithLocation) => {
    e.stopPropagation();
    onUserClick?.(user);
    setListOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <Map center={defaultCenter} zoom={defaultZoom} theme="light">
        <UsersFitBounds users={liveUsers} fitSignal={fitSignal} />
        <FlyToTarget target={flyTarget} />
        <MapControls position="bottom-right" showLocate={false} />
        {liveUsers.map((user) => (
          <MapMarker key={user.id} longitude={user.longitude} latitude={user.latitude} onClick={() => onUserClick?.(user)}>
            <MarkerContent>
              <div className="relative flex items-center justify-center cursor-pointer">
                <div className="absolute h-12 w-12 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="relative h-10 w-10 rounded-full border-2 border-white shadow-lg overflow-hidden bg-blue-500 flex items-center justify-center">
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt={user.full_name || 'User'} className="h-full w-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'; }} />
                  ) : null}
                  <span className="text-white text-xs font-bold select-none" style={{ display: user.profile_picture ? 'none' : 'flex' }}>
                    {(user.full_name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </MarkerContent>
            <MarkerPopup className="min-w-[220px]">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100 mb-2">
                <UserAvatar user={user} />
                <div className="text-sm font-semibold text-slate-900 leading-tight">{user.full_name || 'No Name'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-500">{user.email}</div>
                <div className="text-xs text-slate-600">Phone: {user.phone_number || '—'}</div>
                <div className="text-xs text-slate-600">Role: {user.role || 'user'}</div>
              </div>
            </MarkerPopup>
          </MapMarker>
        ))}
      </Map>

      {/* Top-left: live count pill — clickable */}
      <div ref={listRef} className="absolute top-3 left-3 z-20">
        <button
          type="button"
          onClick={() => { setListOpen((o) => !o); setSearch(''); }}
          className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full pl-3 pr-3.5 py-1.5 shadow-sm text-xs font-medium text-gray-700 hover:bg-white transition-colors"
        >
          <Search className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          <span>Search users</span>
          <span className="flex items-center gap-1 bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
            {liveUsers.length}
          </span>
        </button>

        {/* Dropdown list */}
        {listOpen && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Users</span>
              <button type="button" onClick={() => { setListOpen(false); setSearch(''); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  autoFocus
                />
              </div>
            </div>

            {/* User list */}
            <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50">
              {filteredUsers.length === 0 ? (
                <li className="px-4 py-5 text-center text-xs text-gray-400">No users found</li>
              ) : (
                filteredUsers.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => handleLocate(user)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50/60 transition-colors text-left group"
                    >
                      <UserAvatar user={user} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{user.full_name || 'No Name'}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email || '—'}</p>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="hidden group-hover:flex items-center gap-0.5 text-[10px] text-blue-500 font-medium">
                          <MapPin className="h-3 w-3" /> Locate
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleViewProfile(e, user)}
                          title="View profile"
                          className="hidden group-hover:flex h-6 w-6 items-center justify-center rounded-md hover:bg-blue-100 text-blue-500 ml-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>

            {/* Footer hint */}
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-400 flex items-center gap-3">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Click to locate on map</span>
              <span className="flex items-center gap-1"><ExternalLink className="h-3 w-3" /> View profile</span>
            </div>
          </div>
        )}
      </div>

      {/* Top-right: center all */}
      <div className="absolute top-3 right-3 z-10">
        {onCenterAll && (
          <button
            type="button"
            onClick={onCenterAll}
            disabled={liveUsers.length === 0}
            className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm text-xs font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Center all
          </button>
        )}
      </div>

      {/* Empty state */}
      {liveUsers.length === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/60 backdrop-blur-sm">
          <MapPin className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-500">No users with location data</p>
        </div>
      )}
    </div>
  );
}
