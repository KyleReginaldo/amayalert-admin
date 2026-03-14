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
  const query = searchParams.get('q') || searchParams.get('address') || '';
  const trimmed = query.trim();

  if (!trimmed) {
    return NextResponse.json({ success: false, error: 'Missing search query' }, { status: 400 });
  }

  if (trimmed.length < 3) {
    return NextResponse.json({ success: true, data: [] });
  }

  const cacheKey = `search:${trimmed.toLowerCase()}`;
  const cache = getCache();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ success: true, data: cached.data });
  }

  const userAgent =
    process.env.NOMINATIM_USER_AGENT || 'AmayalertAdmin/1.0 (https://amayalert.site)';

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', trimmed);
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '8');
  url.searchParams.set('countrycodes', 'ph');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Geocode lookup failed (${response.status})` },
        { status: 502 },
      );
    }

    const data = (await response.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      place_id: number;
    }>;

    const results = data.map((item) => ({
      id: item.place_id,
      display_name: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
    }));

    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: results });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Nominatim geocode error:', error);
    return NextResponse.json({ success: false, error: 'Geocode lookup failed' }, { status: 500 });
  }
}
