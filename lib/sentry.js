import * as Sentry from '@sentry/nextjs'

export const logError = (error, context = {}) => {
  // console.error('Error:', error)
  
  Sentry.captureException(error, {
    extra: context,
    tags: {
      section: context.section || 'unknown',
    },
  })
}

export const logGenerationError = (error, prompt, style) => {
  Sentry.captureException(error, {
    extra: {
      prompt,
      style,
      timestamp: new Date().toISOString(),
    },
    tags: {
      feature: 'tattoo_generation',
      style,
    },
  })
}

export const logAPIError = (endpoint, error, requestData) => {
  Sentry.captureException(error, {
    extra: {
      endpoint,
      requestData,
      timestamp: new Date().toISOString(),
    },
    tags: {
      feature: 'api',
      endpoint,
    },
  })
}
