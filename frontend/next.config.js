/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  async headers() {
    return [
      {
        // Allow iframe embedding for embed pages
        source: '/embed/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors *',
          },
        ],
      },
    ];
  },

  // Environment variables available to the client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

// PWA nur in Production laden (in Development oft nicht nötig / vermeidet Modul-Fehler)
module.exports =
  process.env.NODE_ENV === 'production'
    ? require('next-pwa')({
        dest: 'public',
        register: true,
        skipWaiting: true,
      })(nextConfig)
    : nextConfig;
