const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const path = require('path');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const setupSocket = require('./socket/socket');
setupSocket(io);

// Basic route for testing
app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
