require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const httpServer = http.createServer(app);

const ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:5173'];

const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] },
});

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/households', require('./routes/households'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/shopping', require('./routes/shopping'));

io.on('connection', (socket) => {
  socket.on('join:room', (roomId) => socket.join(roomId));
});

app.set('io', io);

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('MongoDB connected');
  httpServer.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
  );
}).catch((err) => console.error('DB connection error:', err));
