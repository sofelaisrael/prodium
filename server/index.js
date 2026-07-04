#!/usr/bin/env node

const { app } = require('./app'); // We only need app here for Vercel export

// Import and mount routes
require('./routes')(app);

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  // Ensure response is sent only once
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler for unmatched routes
app.use((req, res) => {
  if (!res.headersSent) {
    res.status(404).json({ error: 'Route not found' });
  }
});

// Export the app for Vercel to handle
module.exports = app;

// Start server for local development (skipped when imported by Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/`);
  });
}
