// Simple test to see what environment variables are available
console.log('=== ENVIRONMENT DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('RATE_LIMIT_MAX_REQUESTS:', process.env.RATE_LIMIT_MAX_REQUESTS);
console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
console.log('=== END DEBUG ===');

// Try to start a simple HTTP server
const http = require('http');
const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'OK',
    port: PORT,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }));
});

server.listen(PORT, () => {
  console.log(`✅ Simple server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});
