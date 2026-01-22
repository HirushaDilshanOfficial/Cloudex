/** @type {import('next').NextConfig} */
const nextConfig = {
    // Prevent static generation timeout
    staticPageGenerationTimeout: 180,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    }
};

export default nextConfig;
