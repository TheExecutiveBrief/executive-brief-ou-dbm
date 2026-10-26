/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.openai.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "thumbs.dreamstime.com",
        pathname: "/b/**",
      },
    ],
  },
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
