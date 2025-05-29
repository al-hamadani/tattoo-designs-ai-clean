export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// Log specific events
export const event = ({ action, category, label, value }) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Track tattoo generation events
export const trackTattooGenerated = (style, complexity) => {
  event({
    action: 'generate_tattoo',
    category: 'engagement',
    label: style,
    value: complexity
  })
}

// Track AR preview usage
export const trackARPreview = () => {
  event({
    action: 'ar_preview_opened',
    category: 'engagement',
    label: 'ar_feature'
  })
}

// Track downloads
export const trackDownload = (style) => {
  event({
    action: 'download_design',
    category: 'conversion',
    label: style
  })
}

// Track style selection
export const trackStyleSelected = (style) => {
  event({
    action: 'style_selected',
    category: 'engagement',
    label: style
  })
}