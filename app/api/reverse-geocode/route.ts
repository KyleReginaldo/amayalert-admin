import { NextRequest, NextResponse } from 'next/server';

type CachedResponse = {
  expiresAt: number;
  data: unknown;
};

const CACHE_TTL_MS = 60 * 1000;

function getCache() {
  const globalAny = globalThis as typeof globalThis & {
    __nominatimCache?: Map<string, CachedResponse>;
  };
  if (!globalAny.__nominatimCache) {
    globalAny.__nominatimCache = new Map();
  }
  return globalAny.__nominatimCache;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng') || searchParams.get('lon'));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ success: false, error: 'Invalid coordinates' }, { status: 400 });
  }

  const cacheKey = `reverse:${lat.toFixed(6)},${lng.toFixed(6)}`;
  const cache = getCache();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ success: true, data: cached.data });
  }

  const userAgent =
    process.env.NOMINATIM_USER_AGENT || 'AmayalertAdmin/1.0 (https://amayalert.site)';

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', lat.toString());
  url.searchParams.set('lon', lng.toString());

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Reverse geocode failed (${response.status})` },
        { status: 502 },
      );
    }

    const data = (await response.json()) as { display_name?: string };

    const result = {
      address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    };

    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: result });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Nominatim reverse geocode error:', error);
    return NextResponse.json(
      { success: false, error: 'Reverse geocode lookup failed' },
      { status: 500 },
    );
  }
}
