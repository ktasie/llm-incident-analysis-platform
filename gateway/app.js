import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { protect, login } from './controllers/authController.js';
import correlationIdMiddleware from './middleware/correlationId.js';
import createDownstreamServiceErrorHandler from './middleware/downstreamServiceError.js';
import createRequestRoutedMiddleware from './middleware/requestRouted.js';
import responseSentMiddleware from './middleware/responseSent.js';
import logger from './utils/logger.js';

const app = express();

// Set trust proxy to 1 to ensure that the app can correctly identify the client's IP address when behind a reverse proxy.
app.set('trust proxy', 1);

// Allow CORS for the frontend application to access the gateway.
app.use(
  cors({
    origin: `${process.env.FRONTEND_URL}`,
    credentials: true,
  }),
);

// Middleware to parse cookies and log HTTP requests.
app.use(cookieParser());
app.use(morgan('dev'));

// CorrelationId middleware to trace requests across services.
app.use(correlationIdMiddleware);

// Log when any gateway response has finished sending to the client.
app.use(responseSentMiddleware);

// Route for user login, which will authenticate the user and set a JWT cookie.
app.post(
  '/auth',
  createRequestRoutedMiddleware({
    targetServiceName: 'auth-service',
    downstreamRoute: '/api/v1/login',
  }),
  express.json(),
  login,
);

// Proxy middleware for various services, ensuring that requests are forwarded to the appropriate service with the necessary headers.
app.use(
  '/comment',
  protect,
  createRequestRoutedMiddleware({
    targetServiceName: 'comment-service',
    downstreamRoute: '/api/v1/comment',
  }),
  createProxyMiddleware({
    target: `${process.env.COMMENT_SERVICE}/api/v1/comment`,
    changeOrigin: true,
    on: {
      error: createDownstreamServiceErrorHandler({
        targetServiceName: 'comment-service',
      }),
      proxyReq: (proxyReq, req, res) => {
        if (req.user) {
          proxyReq.setHeader('x-user', JSON.stringify(req.user));
        }
      },
    },
  }),
);

// Proxy middleware for the like-service, ensuring that requests are forwarded to the appropriate service with the necessary headers.
app.use(
  '/like',
  protect,
  createRequestRoutedMiddleware({
    targetServiceName: 'like-service',
    downstreamRoute: '/api/v1/like',
  }),
  createProxyMiddleware({
    target: `${process.env.LIKE_SERVICE}/api/v1/like`,
    changeOrigin: true,
    on: {
      error: createDownstreamServiceErrorHandler({
        targetServiceName: 'like-service',
      }),
      proxyReq: (proxyReq, req, res) => {
        if (req.user) {
          proxyReq.setHeader('x-user', JSON.stringify(req.user));
        }
      },
    },
  }),
);

// Proxy middleware for the photo-service, ensuring that requests are forwarded to the appropriate service with the necessary headers.
app.use(
  '/upload',
  protect,
  createRequestRoutedMiddleware({
    targetServiceName: 'photo-service',
    downstreamRoute: '/api/v1/photo',
  }),
  createProxyMiddleware({
    target: `${process.env.PHOTO_SERVICE}/api/v1/photo`,
    changeOrigin: true,
    on: {
      error: createDownstreamServiceErrorHandler({
        targetServiceName: 'photo-service',
      }),
      proxyReq: (proxyReq, req, res) => {
        if (req.user) {
          proxyReq.setHeader('x-user', JSON.stringify(req.user));
        }
      },
    },
  }),
);

// error handling middleware for gateway.
app.use((err, req, res, next) => {
  void logger.error({
    correlationId: req.correlationId || null,
    event: 'SERVICE_EXCEPTION',
    message: 'Unhandled exception in the gateway',
    metadata: {
      method: req.method,
      path: req.originalUrl || req.url,
      errorMessage: err?.message || 'Unexpected gateway error',
      stackTrace: err?.stack || null,
    },
  });

  res.status(err.statusCode || 500).json({
    status: 'fail',
    message: err,
  });
});

// Start the gateway server on the specified port.
const port = process.env.PORT || 4000;

app.listen(port, () => console.log('Proxy gateway running on port 4000'));
