#!/usr/bin/env node

const { app, PORT } = require('./app')
const path = require('path')

// Serve uploaded files
app.use('/uploads', require('express').static(path.join(__dirname, '..', 'uploads')))

// Import and mount routes
require('./routes')(app)

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`API endpoints available at http://localhost:${PORT}/api/`)
})
