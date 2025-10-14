import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://lupi.onrender.com", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

// Supabase configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(helmet());
app.use(cors({
  origin: ["https://lupi.onrender.com", "http://localhost:5173"]
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'LupiBack is running!' });
});

// Basic routes
app.get('/api/game-stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('game_stats')
      .select('*')
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', async (data) => {
    const { userId, roomId } = data;
    socket.join(roomId);
    
    // Update user online status
    await supabase
      .from('room_users')
      .upsert({
        user_id: userId,
        is_online: true,
        last_activity: new Date().toISOString(),
        connection_id: socket.id
      });

    // Broadcast user joined
    socket.to(roomId).emit('user-joined', { userId, socketId: socket.id });
  });

  // Player movement
  socket.on('player-move', async (data) => {
    const { userId, x, y, direction } = data;
    
    await supabase
      .from('room_users')
      .update({
        x,
        y,
        direction,
        last_activity: new Date().toISOString()
      })
      .eq('user_id', userId);

    // Broadcast movement to room
    socket.broadcast.emit('player-moved', {
      userId,
      x,
      y,
      direction
    });
  });

  // Room chat
  socket.on('send-message', async (data) => {
    const { userId, content, username, roomId } = data;
    
    // Save message to database
    const { data: message, error } = await supabase
      .from('room_messages')
      .insert([
        {
          user_id: userId,
          content,
          username,
          room_id: roomId
        }
      ])
      .select()
      .single();

    if (!error) {
      // Broadcast message to room
      io.to(roomId).emit('new-message', message);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    // Update user offline status
    await supabase
      .from('room_users')
      .update({
        is_online: false,
        last_activity: new Date().toISOString()
      })
      .eq('connection_id', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});