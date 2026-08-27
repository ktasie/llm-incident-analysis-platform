import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

import express from 'express';
import mongoose from 'mongoose';
// import cookieParser from 'cookie-parser';
import likeRoute from './routes/likeRoute.js';
import logger from './utils/logger.js';

const port = process.env.PORT || 4003;
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Correlation ID middleware to trace requests across services.
app.use((req, res, next) => {
  req.correlationId = req.get('x-correlation-id')?.trim() || null;
  next();
});

// Routes
app.use('/api/v1/', likeRoute);

app.use((err, req, res, next) => {
  void logger.error({
    correlationId: req.correlationId,
    event: 'SERVICE_EXCEPTION',
    message: 'An unhandled error occurred in the like service',
    metadata: {
      errorMessage: err.message,
      stack: err.stack,
    },
  });

  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    status: 'fail',
    message: `${err.message}`,
  });
});

// Database connection.
if (process.env.NODE_ENV === 'development') {
  mongoose
    .connect(`mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`)
    .then(() => console.log('Like service DB connection successful'))
    .catch((err) => {
      console.log(err.message);
      //process.exit();
    });
} else if (process.env.NODE_ENV === 'production') {
  const DB = process.env.COSMOS_STRING.replace('<DBNAME>', process.env.MONGO_DB);
  mongoose
    .connect(DB)
    .then(() => console.log('Like service Cosmos DB connection successful'))
    .catch((err) => {
      console.log(err.message);
      //process.exit();
    });
}

// start webserver
app.listen(port, () => {
  console.log(`Like service listening on port ${port}`);
});
