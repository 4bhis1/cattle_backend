import mongoose from "mongoose";
import { globalContextPlugin } from './utils/mongoosePlugin';

// Register global plugins before loading models
mongoose.plugin(globalContextPlugin);

import app from './app';
import http from 'http';
import logger from './config/logger';

// Handle Uncaught Exceptions (Synchronous)
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err);
  console.error(err); // Ensure it prints to console even if logger fails
  process.exit(1);
});

const PORT = process.env.PORT || 8000;

import connectDB from './config/database';
import { startCleanupJob } from './services/cleanup.service';
connectDB();
startCleanupJob();

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle Unhandled Rejections (Asynchronous)
process.on('unhandledRejection', (err: any) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// SIGTERM Handling
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated');
  });
});
