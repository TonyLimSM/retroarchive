import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root to THIS project. Without this, Turbopack
  // walks up the directory tree looking for a lockfile, finds a stray
  // package-lock.json in ~/ (the user's home dir), and decides the workspace
  // root is there — which breaks every module resolution. See:
  //   node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/turbopack.md
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // Allow Wikipedia image thumbnails and the Sega Retro database.
    // Each new hostname must be listed explicitly; wildcards are supported on
    // subdomains (e.g. **.wikimedia.org) but not on schemes.
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "media.sega-database.com" },
      { protocol: "https", hostname: "images.igdb.com" },
      // Local Supabase Storage for user-uploaded photos (dev only).
      { protocol: "http", hostname: "127.0.0.1", port: "54321" },
      // Cloud Supabase Storage for production.
      { protocol: "https", hostname: "dbppiemacfdktuhsrybh.supabase.co" },
    ],
  },
};

export default nextConfig;
