import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Magical World',
    short_name: 'MagicWorld',
    description: 'A magical world for young explorers — leave voice messages and watch your creatures appear.',
    start_url: '/',
    display: 'standalone',
    background_color: '#04010d',
    theme_color: '#1a3a2a',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['kids', 'entertainment', 'education'],
  };
}
