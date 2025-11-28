import canUseDOM from './canUseDOM'

export const getServerSideURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_SERVER_URL
  if (envUrl) return envUrl

  if (process.env.NEXT_RUNTIME === 'nodejs' || typeof window === 'undefined') {
    const host = process.env.HOSTNAME || process.env.HOST || '127.0.0.1'
    const port = process.env.PORT || 3000
    return `http://${host}:${port}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  return `http://127.0.0.1:${process.env.PORT || 3000}`
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  return process.env.NEXT_PUBLIC_SERVER_URL || ''
}
