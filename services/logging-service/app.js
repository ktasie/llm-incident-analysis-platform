import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import logsRoute from './routes/logsRoutes.js';

const app = express();
const port = process.env.PORT || 4005;

app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

app.use('/api/v1/', logsRoute);

const mongoUri =
  process.env.NODE_ENV === 'production' && process.env.COSMOS_STRING
    ? process.env.COSMOS_STRING
    : `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`;

mongoose
  .connect(mongoUri)
  .then(() => console.log('Logging service DB connection successful'))
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: 'fail',
    message: err.message || 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(`Logging service listening on port ${port}`);
});
