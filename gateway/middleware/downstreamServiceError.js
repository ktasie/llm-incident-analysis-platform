import logger from '../utils/logger.js';

// Function to determine the appropriate HTTP status code based on the error code received from downstream services.
const getStatusCode = (errorCode) => {
  if (/HPE_INVALID/.test(errorCode)) {
    return 502;
  }

  switch (errorCode) {
    case 'ECONNRESET':
    case 'ENOTFOUND':
    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
      return 504;
    default:
      return 500;
  }
};

const isResponseLike = (value) => value && typeof value.writeHead === 'function';
const isSocketLike = (value) => value && typeof value.write === 'function' && !('writeHead' in value);

// Middleware to handle errors from downstream services and log them appropriately.
const createDownstreamServiceErrorHandler =
  ({ targetServiceName }) =>
  (err, req, res) => {
    const responseTimeMs =
      typeof req.downstreamRequestStartedAt === 'number' ? Date.now() - req.downstreamRequestStartedAt : null;
    const downstreamStatusCode = typeof err?.statusCode === 'number' ? err.statusCode : null;

    void logger.error({
      correlationId: req.correlationId || null,
      event: 'DOWNSTREAM_SERVICE_ERROR',
      message: 'Downstream microservice request failed',
      metadata: {
        targetServiceName,
        method: req.method,
        requestRoute: req.originalUrl || req.url,
        downstreamStatusCode,
        errorMessage: err?.message || 'Downstream service request failed',
        responseTimeMs,
      },
    });

    if (!req && !res) {
      throw err;
    }

    if (isResponseLike(res)) {
      if (!res.headersSent) {
        res.writeHead(getStatusCode(err?.code));
      }

      const host = req.headers && req.headers.host;
      res.end(`Error occurred while trying to proxy: ${host}${req.url}`);
      return;
    }

    if (isSocketLike(res)) {
      res.destroy();
    }
  };

export default createDownstreamServiceErrorHandler;
