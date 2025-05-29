import { withSentryConfig } from '@sentry/nextjs'

const nextConfig = {
  reactStrictMode: true,
}

const sentryWebpackPluginOptions = {
  org: 'your-org-name',
  project: 'tattoodesignsai',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  hideSourceMaps: true,
  disableLogger: true,
}

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions)