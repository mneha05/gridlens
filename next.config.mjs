/** @type {import('next').NextConfig} */
const nextConfig = {
  optimizeFonts: false,
  webpack: (config) => {
    // sql.js ships a wasm + fs fallback; we only use it client-side.
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false };
    return config;
  },
};
export default nextConfig;
