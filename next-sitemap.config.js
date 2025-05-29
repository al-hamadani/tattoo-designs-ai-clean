module.exports = {
    siteUrl: 'https://tattoodesignsai.com', // Replace with your domain
    generateRobotsTxt: true,
    generateIndexSitemap: false,
    exclude: ['/api/*'],
    robotsTxtOptions: {
      additionalSitemaps: [
        'https://tattoodesignsai.com/sitemap.xml',
      ],
      policies: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/api/', '/admin/'],
        },
      ],
    },
  }
  