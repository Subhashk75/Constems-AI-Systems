import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import datasetRoutes from './routes/datasetRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests.' } },
});
app.use('/api', limiter);

// API Routes
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date() });
});

app.use('/api/v1/datasets', datasetRoutes);

// Error Handler
app.use(errorHandler);

// Database Connection with Memory Server Fallback
async function startServer() {
  const mongoUri = process.env.MONGODB_URI ;

  try {
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('Successfully connected to local/remote MongoDB.');
  } catch (err: any) {
    console.warn(`Local MongoDB connection failed (${err.message}). Starting MongoDB Memory Server...`);
    try {
      const mongoServer = await MongoMemoryServer.create({ binary: { version: '6.0.14' } });
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`Successfully connected to MongoDB Memory Server at ${memoryUri}`);
    } catch (memErr: any) {
      console.error('Failed to initialize MongoDB Memory Server:', memErr.message);
      process.exit(1);
    }
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});

export default app;
