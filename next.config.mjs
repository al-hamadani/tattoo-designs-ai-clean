// next.config.mjs
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Add rule for WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Exclude MediaPipe from server-side bundling
    if (isServer) {
      config.externals.push('@mediapipe/pose', '@mediapipe/selfie_segmentation');
    }

    return config;
  },
};


const sentryWebpackPluginOptions = {
  org: 'tattoodesignsai.com',
  project: 'tattoodesignsai',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  hideSourceMaps: true,
  disableLogger: true,
}

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions)