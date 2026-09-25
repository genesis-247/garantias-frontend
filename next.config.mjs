/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  // Un solo origen para el navegador: /api/v1 se reenvía al backend (sin CORS y sin exponer su URL).
  async rewrites() {
    const backend = process.env.BACKEND_URL ?? "http://localhost:8080";
    return [{ source: "/api/v1/:ruta*", destination: `${backend}/api/v1/:ruta*` }];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
