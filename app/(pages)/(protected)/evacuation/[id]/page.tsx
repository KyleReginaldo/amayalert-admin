'use client';
import { evacuationAPI, type EvacuationCenter } from '@/app/lib/evacuation-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

function getStatusVariant(status?: string | null) {
  switch (status) {
    case 'open':
      return 'default' as const;
    case 'full':
      return 'destructive' as const;
    case 'maintenance':
      return 'secondary' as const;
    case 'closed':
      return 'outline' as const;
    default:
      return 'outline' as const;
  }
}

export default function EvacuationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = useMemo(() => Number(params?.id), [params]);

  const [center, setCenter] = useState<EvacuationCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await evacuationAPI.getEvacuationCenter(id);
        if (!mounted) return;
        if (res.success && res.data) {
          setCenter(res.data);
          setError(null);
        } else {
          setError(res.error || 'Failed to load evacuation center');
        }
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load evacuation center');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (!Number.isFinite(id)) {
      setError('Invalid evacuation id');
      setLoading(false);
      return;
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading evacuation center…</span>
        </div>
      </div>
    );
  }

  if (error || !center) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto max-w-3xl">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="rounded-lg border bg-white p-6">
            <p className="text-red-600 font-medium">{error || 'Center not found'}</p>
            <p className="text-sm text-gray-600 mt-2">
              Go back to the{' '}
              <Link href="/evacuation" className="underline">
                list
              </Link>{' '}
              and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const occupancyPct = center.capacity
    ? Math.min(Math.round(((center.current_occupancy || 0) / center.capacity) * 100), 100)
    : 0;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{center.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
              <Badge variant={getStatusVariant(center.status || 'closed')}>
                {center.status || 'closed'}
              </Badge>
              <span>#{center.id}</span>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/evacuation')}>
            Back to list
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left column: Overview + Photos */}
          <div className="md:col-span-2 space-y-4">
            <div className="rounded-lg border bg-white p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Overview</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">
                    {center.current_occupancy || 0} / {center.capacity || 0}
                  </span>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Occupancy</span>
                    <span className="font-medium">{occupancyPct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                </div>

                <Separator />
                <div className="flex justify-between">
                  <span>Created</span>
                  <span>{new Date(center.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center gap-2 text-gray-700">
                  <span>Contact</span>
                  <div className="text-sm">
                    <div className="font-medium">{center.contact_name || 'N/A'}</div>
                    <div className="text-gray-600">{center.contact_phone || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Photos within left column */}
            <div className="rounded-lg border bg-white p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Photos</h2>
              {center.photos && center.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {center.photos.map((url, i) => (
                    <div key={i} className="rounded overflow-hidden border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Photo ${i + 1}`} className="h-40 w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No photos uploaded.</p>
              )}
            </div>
          </div>

          {/* Right column: Location (with map) and Details stacked */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-white overflow-hidden">
              <div className="p-4">
                <h2 className="text-base font-semibold text-gray-900 mb-2">Location</h2>
                <div className="flex items-start gap-2 text-gray-700">
                  <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm">{center.address}</div>
                    <Link
                      href={`https://www.google.com/maps/search/?api=1&query=${center.latitude},${center.longitude}`}
                      target="_blank"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Open in Google Maps
                    </Link>
                  </div>
                </div>
              </div>
              <iframe
                title="Evacuation center map"
                src={`https://www.google.com/maps?q=${center.latitude},${center.longitude}&z=15&output=embed`}
                className="w-full h-56 md:h-64 border-t"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        {/* Photos moved into left column above */}
      </div>
    </div>
  );
}
