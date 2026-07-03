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

// The following lines are for local development and should be conditional
// or removed if Vercel handles the port binding.
// If you still want to run this locally with `node server/index.js`,
// you might need to conditionally start the server.
// For Vercel, the `app.listen` part is not needed.

// Example of conditional start for local development:
// if (process.env.NODE_ENV !== 'production') {
//   const PORT = process.env.PORT || 5000; // Use a default port if not set
//   app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//     console.log(`API endpoints available at http://localhost:${PORT}/api/`);
//   });
// }
