/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};
export default nextConfig;
