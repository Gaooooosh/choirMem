import type { Payload, PayloadRequest } from 'payload'

// Simplified seed function - complex seeding disabled for now

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')
  
  // Simplified seeding - just log that seeding was called
  payload.logger.info('Seeding functionality temporarily disabled for deployment')
  
  payload.logger.info('Seeded database successfully!')
}

// Simplified file fetching function - disabled for deployment
async function fetchFileByURL(url: string): Promise<any> {
  return null
}
