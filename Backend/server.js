import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import config from './src/config/index.js';
import connectDB from './src/config/db.js';
import initializeSocket from './src/sockets/socketHandler.js';

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Create HTTP server from Express app
  const httpServer = createServer(app);

  // Initialize Socket.IO with CORS and connection settings
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Attach socket event handlers
  initializeSocket(io);

  // Start listening
  httpServer.listen(config.port, () => {
    console.log(`\n🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
    console.log(`🔒 Post-Quantum Encryption: CRYSTALS-Kyber (ML-KEM-1024) enabled`);
    console.log(`🛡️  Dual-layer AES-256-GCM encryption active`);
    console.log(`📡 WebSocket server ready\n`);
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});