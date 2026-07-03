const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const dotenv = require('dotenv')

const { createClient } = require('@supabase/supabase-js')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({
  origin: [
    'https://prodium.vercel.app',
    'https://prodmin.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))
// Skip JSON parsing for file uploads
app.use((req, res, next) => {
  if (req.path === '/api/upload') return next()
  express.json({ limit: '10mb' })(req, res, next)
})
app.use(express.urlencoded({ extended: true }))
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}))

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : supabase

module.exports = { app, PORT, supabase, supabaseAdmin }
