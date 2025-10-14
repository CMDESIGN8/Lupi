require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const playersRoutes = require('./src/routes/players');
const socketHandlers = require('./src/socketHandlers');


const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/players', playersRoutes);


const server = http.createServer(app);
const io = new Server(server, {
cors: {
origin: process.env.CLIENT_ORIGIN || '*',
methods: ['GET', 'POST']
}
});


socketHandlers(io);


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Lupi backend listening on port ${PORT}`));