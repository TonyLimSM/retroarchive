import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow Wikipedia image thumbnails and the Sega Retro database.
    // Each new hostname must be listed explicitly; wildcards are supported on
    // subdomains (e.g. **.wikimedia.org) but not on schemes.
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "media.sega-database.com" },
      // Local Supabase Storage for user-uploaded photos.
      { protocol: "http", hostname: "127.0.0.1", port: "54321" },
    ],
  },
};

export default nextConfig;
