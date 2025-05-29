import * as Sentry from '@sentry/nextjs'
import { Replay } from '@sentry/replay'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_COMMIT_SHA,
  
  integrations: [
    new Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Filter out known errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    '/Failed to fetch/',
  ],
  
  beforeSend(event, hint) {
    // Filter out errors from browser extensions
    if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
      frame => frame.filename?.includes('chrome-extension://')
    )) {
      return null
    }
    
    // Add user context
    if (typeof window !== 'undefined') {
      event.contexts = {
        ...event.contexts,
        custom: {
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          screen: {
            width: window.screen.width,
            height: window.screen.height,
          },
        },
      }
    }
    
    return event
  },
})