import logger from '../utils/logger.js';

const responseSentMiddleware = (req, res, next) => {
  res.on('finish', () => {
    const requestDurationMs =
      typeof req.gatewayRequestStartedAt === 'number' ? Date.now() - req.gatewayRequestStartedAt : null;

    void logger.info({
      correlationId: req.correlationId || null,
      event: 'RESPONSE_SENT',
      message: 'Gateway response sent to client',
      metadata: {
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        requestDurationMs,
      },
    });
  });

  next();
};

export default responseSentMiddleware;
