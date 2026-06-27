import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

import express from 'express';
import mongoose from 'mongoose';
// import cookieParser from 'cookie-parser';
import photoRoute from './routes/photoRoute.js';

const port = process.env.PORT || 4004;
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use((req, res, next) => {
  req.correlationId = req.get('x-correlation-id')?.trim() || null;
  next();
});

// Routes
app.use('/api/v1/', photoRoute);

// Database connection.
if (process.env.NODE_ENV === 'development') {
  mongoose
    .connect(`mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`)
    .then(() => console.log('Photo service DB connection successful'))
    .catch((err) => {
      console.log(err.message);
      process.exit(1);
    });
} else if (process.env.NODE_ENV === 'production') {
  const DB = process.env.COSMOS_STRING.replace('<DBNAME>', process.env.MONGO_DB);
  console.log(DB);
  mongoose
    .connect(DB)
    .then(() => console.log('Photo service Cosmos DB connection successful'))
    .catch((err) => {
      console.log(err.message);
      process.exit(1);
    });
}

// start webserver
app.listen(port, () => {
  console.log(`Photo service listening on port ${port}`);
});
