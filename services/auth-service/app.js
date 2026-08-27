import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

import loginRoute from './routes/loginRoute.js';
import logger from './utils/logger.js';

const port = process.env.PORT || 4001;
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Middleware to extract correlation ID from request headers and attach it to the request object.
app.use((req, res, next) => {
  req.correlationId = req.get('x-correlation-id')?.trim() || null;
  next();
});

// Routes
app.use('/api/v1/', loginRoute);

// Database connection.
if (process.env.NODE_ENV === 'development') {
  mongoose
    .connect(`mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`)
    .then(() => console.log('Authentication service DB connection successful'))
    .catch((err) => {
      console.log(err.message);
      //process.exit();
    });
} else if (process.env.NODE_ENV === 'production') {
  const DB = process.env.COSMOS_STRING.replace('<DBNAME>', process.env.MONGO_DB);
  mongoose
    .connect(DB)
    .then(() => console.log('Authentication service cosmos DB connection successful'))
    .catch((err) => {
      console.log(err.message);
      process.exit();
    });
}

// error handling middleware for authentication service.
app.use((err, req, res, next) => {
  // Log the error details for debugging and monitoring purposes.
  void logger.error({
    correlationId: req.correlationId || null,
    event: 'SERVICE_EXCEPTION',
    message: 'Unhandled exception in the authentication service',
    metadata: {
      method: req.method,
      path: req.originalUrl || req.url,
      errorMessage: err?.message || 'Unexpected photo service error',
      stackTrace: err?.stack || null,
    },
  });

  res.status(err.statusCode || 500).json({
    status: 'fail',
    message: err,
  });
});

// start webserver
app.listen(port, () => {
  console.log(`Authication service listening on port ${port}`);
});
