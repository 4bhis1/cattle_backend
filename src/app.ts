import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import passport from 'passport';
import session from 'express-session';
import dotenv from 'dotenv';
import routes from './routes';
import { globalErrorHandler } from './middleware/error.middleware';
import { AppError } from './utils/AppError';
import logger from './config/logger';
import features from './config/features';
import { setupPassport } from './config/passport';

dotenv.config();

const app = express();

// 1) GLOBAL MIDDLEWARES

// Security HTTP headers
app.use(helmet());

// Initialize Context
import { contextMiddleware } from './utils/context';
app.use(contextMiddleware);

// CORS
app.use(
  cors({
    origin: '*', // Configure this better for production
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Development logging
if (features.logging.enabled) {
  const stream = {
    write: (message: string) => logger.http(message.trim()),
  };
  app.use(morgan('combined', { stream }));
}

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression
app.use(compression());

// Session (Required for Passport 0.5+ esp with OAuth)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true
    }
  })
);

// Passport
if (features.auth.enabled) {
  app.use(passport.initialize());
  app.use(passport.session());
  setupPassport();
}

// Swagger Docs
import { setupSwagger } from './config/swagger';
setupSwagger(app);

// 2) ROUTES
app.use('/api/v1', routes);

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'running', message: 'Server is healthy' });
});

// 404 Handler
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 3) ERROR HANDLER
app.use(globalErrorHandler);

export default app;
