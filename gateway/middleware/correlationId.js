import crypto from 'crypto';
import logger from '../utils/logger.js';

const correlationIdMiddleware = (req, res, next) => {
  req.gatewayRequestStartedAt = Date.now();

  const incomingCorrelationId = req.get('x-correlation-id');
  const correlationId = incomingCorrelationId && incomingCorrelationId.trim() ? incomingCorrelationId : crypto.randomUUID();

  req.correlationId = correlationId;
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  // Log the request received event with correlationId
  void logger.info({
    correlationId,
    event: 'REQUEST_RECEIVED',
    message: 'Request received by gateway',
    metadata: {
      method: req.method,
      path: req.originalUrl || req.url,
      clientIp: req.ip,
    },
  });

  next();
};

export default correlationIdMiddleware;