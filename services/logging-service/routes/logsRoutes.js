import express from 'express';
import { createLog, getLogs, getLogsByCorrelationId, searchLogs } from '../controllers/logsController.js';

const router = express.Router();

router.post('/logs', createLog);
router.get('/logs', getLogs);
router.get('/logs/search', searchLogs);
router.get('/logs/:correlationId', getLogsByCorrelationId);

export default router;
