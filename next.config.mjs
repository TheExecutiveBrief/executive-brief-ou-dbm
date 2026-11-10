/** @type {import(‘next’).NextConfig} */
const nextConfig = {
reactStrictMode: true,

images: {
remotePatterns: [
{
protocol: “https”,
hostname: “images.unsplash.com”,
pathname: “/”,
},
{
protocol: “https”,
hostname: “images.openai.com”,
pathname: “/”,
},
{
protocol: “https”,
hostname: “thumbs.dreamstime.com”,
pathname: “/”,
},
{
protocol: “https”,
hostname: “media.istockphoto.com”,
pathname: “/”,
},
{
protocol: “https”,
hostname: “images.pexels.com”,
pathname: “/”,
},
{
protocol: “https”,
hostname: “plus.unsplash.com”,
pathname: “/”,
},
{
protocol: “https”,
hostname: “cdn.pixabay.com”,
pathname: “/**”,
},
],
},

experimental: {
cpus: 1,
},
};

export default nextConfig;
