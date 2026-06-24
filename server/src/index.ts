import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import apiRouter from './routes';
import { socketHandler } from './sockets/socketHandler';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For development. Can be locked down to specific domains.
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Configure Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading local uploads files directly if needed
}));
app.use(cors({
  origin: '*', // Allow all origins for dev simplicity
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve secure local uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Register API Routes
app.use('/api', apiRouter);

// Basic health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'Internal Communication Platform API is running.' });
});

// Mount socket event listeners
socketHandler(io);
app.set('socketio', io);

// Connect database and start server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`  SERVER RUNNING ON PORT: ${PORT}`);
    console.log(`=============================================`);
  });
});
