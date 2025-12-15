// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;




// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: false, // <--- THIS STOPS DOUBLE REQUESTS
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'ik.imagekit.io',
//       },
//     ],
//   },
// };

// module.exports = nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // <--- CRITICAL FIX FOR 429 ERROR
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
    ],
  },
};

module.exports = nextConfig;


