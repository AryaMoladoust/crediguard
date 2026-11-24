export default {
  reactStrictMode: true,
  poweredByHeader: false,
  // صفحه اصلی فروشگاه در /shop قرار دارد (دورزدن باگ Next با page ریشه داخل route group)
  async rewrites() { return [{ source: '/', destination: '/shop' }]; },
  async redirects() { return [{ source: '/shop', destination: '/', permanent: false }]; },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
    ] }];
  }
};
