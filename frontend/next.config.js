/** @type {import("next").NextConfig} */
const nextConfig = {
  // PWA configuration is handled via service worker in public/sw.js
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
