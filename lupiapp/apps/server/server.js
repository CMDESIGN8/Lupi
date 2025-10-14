import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import routes from './routes/index.js';
import { setupSocketHandlers } from './sockets/gameSocket.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://lupi.onrender.com", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: ["https://lupi.onrender.com", "http://localhost:5173"]
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'LupiBack is running!' });
});

// Socket.io setup
setupSocketHandlers(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   👤 /api/users/*`);
  console.log(`   🎯 /api/missions/*`);
  console.log(`   🛍️ /api/shop/*`);
  console.log(`   🏆 /api/clubs/*`);
});