/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",          // Required for GitHub Pages static export
  trailingSlash: true,       // Ensures correct routing on static hosts
  images: {
    unoptimized: true,       // Next.js Image optimization requires a server; disable for static export
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
