import 'dotenv/config';

import appInsights from 'applicationinsights';

appInsights
  .setup(process.env.APPINSIGHTS_CONNECTION_STRING)
  .setAutoCollectRequests(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectExceptions(true)
  .setAutoCollectConsole(true)
  .setSendLiveMetrics(true) // <- important for Live Metrics
  .start();
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import viewsRoute from './routes/viewsRoute.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define templete engine: PUG
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware
// app.use(express.json({ limit: '10kb' }));
// app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
// Routes
app.use('/', viewsRoute);

// error handling middleware for frontend.
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: 'fail',
    message: err.message,
  });
});

// Define port
const port = process.env.PORT || 3000;

// start webserver.
app.listen(port, (req, res) => {
  console.log(`Frontend running on port ${port}`);
});
