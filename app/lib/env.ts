// Centralized environment accessors

export function getGoogleMapsApiKey(): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAP || '';
  return key;
}

export function assertGoogleMapsApiKey(): string {
  const key = getGoogleMapsApiKey();
  if (!key) {
    // Provide a clear runtime error to surface configuration issues quickly
    throw new Error(
      'Missing Google Maps API key. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file.',
    );
  }
  return key;
}
