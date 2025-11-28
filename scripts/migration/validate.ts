import { getPayload } from 'payload'
import config from '@/payload.config'
import fs from 'fs'

async function main() {
  const payload = await getPayload({ config })
  const collections = [
    'users',
    'tracks',
    'track-versions',
    'scores',
    'comments',
    'articles',
    'invitation-codes',
    'permission-groups',
  ]

  const counts: Record<string, number> = {}
  for (const col of collections) {
    const result = await payload.find({ collection: col as any, limit: 1 })
    counts[col] = result.totalDocs || result.docs.length
  }

  let mappings: any = null
  try {
    const raw = fs.readFileSync('id-mappings.json', 'utf-8')
    mappings = JSON.parse(raw)
  } catch {}

  const summary = { counts, mappingsPresent: !!mappings }
  fs.writeFileSync('migration-validate.json', JSON.stringify(summary, null, 2))
  console.log('Validation written to migration-validate.json')
}

main()
