/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizeCss: true, // Ensures animations are optimized at build
    scrollRestoration: true, // Helps smooth animation/page transitions
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // Reduce unnecessary logs for performance
  },
  // Allow embedding in iframes
  async headers() {
    return [
      {
        source: "/widget/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
          {
            key: "X-Widget-Script-Duplication-Warning",
            value: "Ensure only one widget script is loaded per page."
          }
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
  // Developer note: Prevent duplicate widget script inclusion in /widget routes. Only inject the script once per page/component.
};

export default nextConfig;
