import logger from '../utils/logger.js';

const createRequestRoutedMiddleware =
  ({ targetServiceName, downstreamRoute }) =>
  (req, res, next) => {
    req.downstreamRequestStartedAt = Date.now();

    void logger.info({
      correlationId: req.correlationId || null,
      event: 'REQUEST_ROUTED',
      message: 'Request routed to downstream microservice',
      metadata: {
        targetServiceName,
        gatewayRoute: req.originalUrl || req.url,
        downstreamRoute: `${downstreamRoute}${req.url || ''}`,
        method: req.method,
      },
    });

    next();
  };

export default createRequestRoutedMiddleware;
