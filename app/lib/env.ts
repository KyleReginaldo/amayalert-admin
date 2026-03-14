// Centralized environment accessors

const DEFAULT_LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const DEFAULT_DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export function getMapStyleUrls() {
  return {
    light: process.env.NEXT_PUBLIC_MAP_STYLE_LIGHT_URL || DEFAULT_LIGHT_STYLE,
    dark: process.env.NEXT_PUBLIC_MAP_STYLE_DARK_URL || DEFAULT_DARK_STYLE,
  };
}

export function getMapStyleUrl(theme: 'light' | 'dark' = 'light') {
  const urls = getMapStyleUrls();
  return theme === 'dark' ? urls.dark : urls.light;
}
