/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  // Startkatalog für "Katalog einspielen" mit ausliefern
  outputFileTracingIncludes: { "/admin": ["./data/artikel.csv"], "/admin/import": ["./data/artikel.csv"] },
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};
export default nextConfig;
