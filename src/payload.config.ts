// storage-adapter-import-placeholder
import { sqliteAdapter } from '@payloadcms/db-sqlite'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

// Import new collections for choir management
import { Articles } from './collections/Articles'
import { Tracks } from './collections/Tracks'
import { TrackVersions } from './collections/TrackVersions'
import { Scores } from './collections/Scores'
import { UserCollections } from './collections/UserCollections'
import { Tags } from './collections/Tags'
import { Comments } from './collections/Comments'
import { PermissionGroups } from './collections/PermissionGroups'
import { PermissionChangeLogs } from './collections/PermissionChangeLogs'
import { InvitationCodes } from './collections/InvitationCodes'
import { Announcements } from './collections/Announcements'
import { Users } from './collections/Users'
import { EditHistory } from './collections/EditHistory'
import { PendingEdits } from './collections/PendingEdits'
import { EditLocks } from './collections/EditLocks'

// Import custom endpoints
import { register } from './endpoints/auth/register'
import { wikiEndpoints } from './endpoints/wiki'

// Import global settings
import { SystemSettings } from './globals/SystemSettings'

// Original template collections (to be removed later)
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import sqlite3 from 'sqlite3'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:./data/data.db',
    },
    push: true,
  }),
  collections: [
    // New choir management collections
    Articles,
    Tracks,
    TrackVersions,
    Scores,
    UserCollections,
    Tags,
    Comments,
    PermissionGroups,
    PermissionChangeLogs,
    InvitationCodes,
    Announcements,
    Users,
    EditHistory,
    PendingEdits,
    EditLocks,
    // Original template collections (to be removed later)
    Pages,
    Posts,
    Media,
   ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [
    SystemSettings,
    // Original template globals
    Header,
    Footer,
  ],
  plugins: [
    ...plugins,
    // storage-adapter-placeholder
  ],
  email: process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailerAdapter({
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 465),
          secure: String(process.env.SMTP_SECURE || 'true') === 'true',
          auth: {
            user: process.env.SMTP_USER as string,
            pass: process.env.SMTP_PASS as string,
          },
        },
        defaultFromAddress: (() => {
          const from = process.env.SMTP_FROM || ''
          const user = process.env.SMTP_USER || ''
          const fromDomain = from.split('@')[1]
          const userDomain = user.split('@')[1]
          return from && fromDomain === userDomain ? from : user
        })(),
        defaultFromName: 'ChoirMem',
      })
    : undefined,
  secret: process.env.PAYLOAD_SECRET || 'dev-secret',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  endpoints: [
    {
      path: '/auth/register',
      method: 'post',
      handler: register,
    },
    ...wikiEndpoints,
  ],
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
  onInit: async () => {
    try {
      const uri = process.env.DATABASE_URI || 'file:./data/data.db'
      const dbPath = uri.startsWith('file:') ? uri.slice(5) : uri
      const db = new sqlite3.Database(dbPath)
      const rows: any[] = await new Promise<any[]>((resolve, reject) => {
        db.all('PRAGMA table_info(users)', (err, r) => (err ? reject(err) : resolve(r as any[])))
      })
      const names = new Set(rows.map((r: any) => r.name))
      const alters: string[] = []
      if (!names.has('email_verification_last_sent')) alters.push('ALTER TABLE "users" ADD COLUMN "email_verification_last_sent" TEXT')
      if (!names.has('pending_email_verification_last_sent')) alters.push('ALTER TABLE "users" ADD COLUMN "pending_email_verification_last_sent" TEXT')
      for (const sql of alters) {
        await new Promise((resolve, reject) => db.run(sql, (err) => (err ? reject(err) : resolve(null))))
      }
      await new Promise((resolve) => db.close(() => resolve(null)))
    } catch {}
  },
})
