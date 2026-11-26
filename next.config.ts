import type { NextConfig } from 'next';

// Static export for GitHub Pages. PAGES_BASE_PATH comes from actions/configure-pages ("/tracuu", or "" on a custom domain).
// To move to Vercel later: drop `output` and `basePath`, and server features become available.
const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.PAGES_BASE_PATH || '',
  images: { unoptimized: true },
};

export default nextConfig;
