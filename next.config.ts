/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@mui/x-date-pickers',
    'date-fns'
  ],
  compiler: {
    emotion: true,
  }
};

export default nextConfig;
