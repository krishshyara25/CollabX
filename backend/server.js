const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./database/connect');
const socketHandler = require('./socket/socketHandler');

const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const adminRoutes = require('./routes/adminRoutes');
const messageRoutes = require('./routes/messageRoutes');
const whiteboardRoutes = require('./routes/whiteboardRoutes');
const noteRoutes = require('./routes/noteRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/whiteboard', whiteboardRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/calendar', calendarRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

socketHandler(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
