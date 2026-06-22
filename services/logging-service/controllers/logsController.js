import Log from '../models/logModel.js';

const createLog = async (req, res) => {
  try {
    const { service, severity, correlationId, event, message, metadata, timestamp } = req.body;

    if (!service || !severity || !message) {
      const err = new Error('service, severity, and message are required');
      err.statusCode = 400;
      throw err;
    }

    const log = await Log.create({
      service: service.toLowerCase(),
      severity: severity.toUpperCase(),
      correlationId: correlationId || null,
      event: event || null,
      message,
      metadata: metadata || {},
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    res.status(201).json({
      status: 'success',
      data: log,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: err.message || 'Unable to create log',
    });
  }
};

const getLogs = async (req, res) => {
  try {
    const { service, severity, limit = 100, skip = 0 } = req.query;

    // Allowed severities
    const allowedSeverities = ['debug', 'info', 'warn', 'error', 'critical', 'fatal'];

    if (severity && !allowedSeverities.includes(severity)) {
      const err = new Error(`Invalid severity. Allowed values are: ${allowedSeverities.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const filter = {};

    if (service) filter.service = service.toLowerCase();
    if (severity) filter.severity = severity.toUpperCase();

    const count = await Log.countDocuments(filter);
    const logs = await Log.find(filter).sort({ timestamp: -1 }).skip(Number(skip)).limit(Number(limit));

    res.status(200).json({
      status: 'success',
      count,
      data: logs,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: err.message || 'Unable to fetch logs',
    });
  }
};

const getLogsByCorrelationId = async (req, res) => {
  try {
    const { correlationId } = req.params;

    if (!correlationId) {
      const err = new Error('correlationId is required');
      err.statusCode = 400;
      throw err;
    }

    const logs = await Log.find({ correlationId }).sort({ timestamp: 1 });

    res.status(200).json({
      status: 'success',
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: err.message || 'Unable to fetch logs by correlationId',
    });
  }
};

const searchLogs = async (req, res) => {
  try {
    const { q, service, severity, limit = 100, skip = 0 } = req.query;
    const filter = {};

    if (service) filter.service = service;
    if (severity) filter.severity = severity;

    const textSearch = q ? new RegExp(q, 'i') : null;
    const query = textSearch
      ? {
          $and: [
            filter,
            {
              $or: [{ message: textSearch }, { service: textSearch }, { correlationId: textSearch }],
            },
          ],
        }
      : filter;

    const count = await Log.countDocuments(query);
    const logs = await Log.find(query).sort({ timestamp: -1 }).skip(Number(skip)).limit(Number(limit));

    res.status(200).json({
      status: 'success',
      count,
      data: logs,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: err.message || 'Unable to search logs',
    });
  }
};

export { createLog, getLogs, getLogsByCorrelationId, searchLogs };
