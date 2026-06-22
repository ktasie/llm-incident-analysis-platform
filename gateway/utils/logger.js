const loggingServiceUrl = (process.env.LOGGING_SERVICE || 'http://logging-service:4005').replace(/\/$/, '');
const logEndpoint = `${loggingServiceUrl}/api/v1/logs`;
const serviceName = 'gateway-service';

const postLog = (
  severity,
  { correlationId = null, event = null, message = '', metadata = {}, timestamp = new Date().toISOString() } = {},
) => {
  try {
    void fetch(logEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp,
        service: serviceName,
        severity,
        correlationId,
        event,
        message,
        metadata,
      }),
    }).catch(() => {});
  } catch {
    // Logging must never interfere with the gateway request flow.
  }
};

const logger = {
  async info(payload = {}) {
    postLog('INFO', payload);
  },

  async warn(payload = {}) {
    postLog('WARN', payload);
  },

  async error(payload = {}) {
    postLog('ERROR', payload);
  },
};

export default logger;
export { logger };
