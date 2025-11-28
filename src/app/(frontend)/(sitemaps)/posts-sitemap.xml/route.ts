export const dynamic = 'force-dynamic'

export async function GET() {
  const SITE_URL =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    'https://example.com'

  const dateFallback = new Date().toISOString()

  const sitemap = [{ loc: `${SITE_URL}/posts`, lastmod: dateFallback }]

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    sitemap
      .map((item) => `\n  <url><loc>${item.loc}</loc><lastmod>${item.lastmod}</lastmod></url>`)
      .join('') +
    `\n</urlset>`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
  })
}
